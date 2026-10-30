import { readFile } from 'node:fs/promises';
import * as tf from '@tensorflow/tfjs';
import {
    createTrainingData,
    createVocabulary,
    recommendTestCases,
    trainModel
} from '../src/service/RecommendationModel.js';

const marker = '<!-- qa-test-case-recommender -->';
const event = JSON.parse(await readFile(process.env.GITHUB_EVENT_PATH, 'utf8'));
const pullRequest = event.pull_request;
if (!pullRequest) {
    throw new Error('This command must run for a pull_request event.');
}

const token = process.env.GITHUB_TOKEN;
if (!token) {
    throw new Error('GITHUB_TOKEN is required to fetch commits and publish the checklist.');
}

const owner = event.repository.owner.login;
const repo = event.repository.name;
const pullNumber = pullRequest.number;
const apiBaseUrl = process.env.GITHUB_API_URL ?? 'https://api.github.com';
const repositoryApiPath = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;

async function githubApi(path, { method = 'GET', body } = {}) {
    const response = await fetch(`${apiBaseUrl}${path}`, {
        method,
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
    });

    if (!response.ok) {
        const details = await response.text();
        throw new Error(`GitHub API request failed (${response.status}): ${details}`);
    }

    return response.status === 204 ? null : response.json();
}

async function githubApiPages(path) {
    const results = [];
    let nextUrl = `${apiBaseUrl}${path}`;
    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });
        if (!response.ok) {
            const details = await response.text();
            throw new Error(`GitHub API request failed (${response.status}): ${details}`);
        }

        results.push(...await response.json());
        const linkHeader = response.headers.get('link') ?? '';
        nextUrl = linkHeader.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? '';
    }
    return results;
}

const commits = await githubApiPages(
    `${repositoryApiPath}/pulls/${pullNumber}/commits?per_page=100`
);
const context = {
    branch: pullRequest.head.ref,
    title: pullRequest.title,
    description: pullRequest.body ?? '',
    commitMessages: commits.map(commit => commit.commit.message)
};

const [testCases, history] = await Promise.all([
    readFile(new URL('../data/test-cases.json', import.meta.url), 'utf8').then(JSON.parse),
    readFile(new URL('../data/change-history.json', import.meta.url), 'utf8').then(JSON.parse)
]);

await tf.ready();
const vocabulary = createVocabulary(testCases, history);
const trainingData = createTrainingData(tf, testCases, history, vocabulary);
const model = await trainModel(tf, trainingData);
const recommendations = recommendTestCases(tf, model, context, testCases, vocabulary).slice(0, 5);

const checklist = recommendations.map((testCase, index) => [
    `### ${index + 1}. ${testCase.id} — ${testCase.functionality}`,
    `- **Componente:** ${testCase.component}`,
    `- **Prioridade:** ${testCase.priority} · **Tipo:** ${testCase.testType}`,
    `- **Objetivo:** ${testCase.objective}`,
    `- **Pré-condições:** ${testCase.preconditions.join(' · ')}`,
    `- **Por que foi recomendado:** ${testCase.reason}`,
    '- **Passos:**',
    ...testCase.steps.map((step, stepIndex) => `  ${stepIndex + 1}. ${step}`),
    '- [ ] Executar caso de teste',
    '- **Acompanhamento QA:** Não executado',
    '',
    '```gherkin',
    `Feature: ${testCase.gherkin.feature}`,
    '',
    `Scenario: ${testCase.gherkin.scenario}`,
    `  Given ${testCase.gherkin.given}`,
    `  When ${testCase.gherkin.when}`,
    `  Then ${testCase.gherkin.then}`,
    '```',
    `- **Resultado esperado:** ${testCase.expectedResult}`
].join('\n')).join('\n\n');

const body = [
    marker,
    '## Checklist recomendado para QA',
    '',
    '> Sugestão gerada por TensorFlow.js a partir do contexto do PR e do histórico de seleção de testes. A QA deve revisar e registrar o resultado da execução.',
    '',
    checklist,
    '',
    '---',
    `Modelo treinado com ${history.length} exemplos de histórico e ${testCases.length} casos do dataset.`
].join('\n');

const comments = await githubApiPages(
    `${repositoryApiPath}/issues/${pullNumber}/comments?per_page=100`
);
const existingComment = comments.find(comment =>
    comment.user?.type === 'Bot' && comment.body?.includes(marker)
);

if (existingComment) {
    await githubApi(`${repositoryApiPath}/issues/comments/${existingComment.id}`, {
        method: 'PATCH',
        body: { body }
    });
} else {
    await githubApi(`${repositoryApiPath}/issues/${pullNumber}/comments`, {
        method: 'POST',
        body: { body }
    });
}

console.log(`Published ${recommendations.length} recommended test cases on PR #${pullNumber}.`);
model.dispose();
