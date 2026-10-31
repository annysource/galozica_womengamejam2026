const STOP_WORDS = new Set([
    'a', 'ao', 'aos', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e',
    'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'para', 'por', 'the', 'to',
    'and', 'or', 'of', 'in', 'on', 'for', 'with', 'is', 'be', 'it',
    'add', 'added', 'change', 'changes', 'changed', 'fix', 'fixed', 'implement',
    'improve', 'update', 'updated', 'assets', 'asset', 'scripts', 'script', 'src'
]);
const HASH_BUCKETS = 64;

const tokenize = value => {
    const text = String(value ?? '');
    const terms = [
        ...(text.match(/[A-Za-z0-9]+/g) ?? []).map(term => term.toLowerCase()),
        ...(text.match(/[A-Z]?[a-z]+|[A-Z]+(?=[A-Z][a-z]|\b)|[0-9]+/g) ?? [])
            .map(term => term.toLowerCase())
    ];
    return terms
        .join(' ')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .match(/[a-z0-9]+/g)
        ?.filter(token => token.length > 1 && !STOP_WORDS.has(token)) ?? [];
};

const contextText = context => [
    context.branch,
    context.title,
    context.description,
    ...(context.commitMessages ?? []),
    ...(context.changedFiles ?? [])
].filter(Boolean).join(' ');

const testCaseText = testCase => [
    testCase.functionality,
    testCase.component,
    testCase.description,
    testCase.objective,
    ...(testCase.preconditions ?? []),
    ...(testCase.steps ?? []),
    testCase.expectedResult,
    testCase.gherkin?.feature,
    testCase.gherkin?.scenario,
    testCase.gherkin?.given,
    testCase.gherkin?.when,
    testCase.gherkin?.then,
    testCase.priority,
    testCase.testType,
    ...(testCase.tags ?? [])
].filter(Boolean).join(' ');

export function createVocabulary(testCases, history) {
    const terms = new Set();
    for (const testCase of testCases) {
        tokenize(testCaseText(testCase)).forEach(term => terms.add(term));
    }
    for (const change of history) {
        tokenize(contextText(change)).forEach(term => terms.add(term));
    }

    return {
        terms: [...terms].sort(),
        priorities: [...new Set(testCases.map(testCase => testCase.priority))].sort(),
        testTypes: [...new Set(testCases.map(testCase => testCase.testType))].sort(),
        hashBuckets: HASH_BUCKETS,
        history
    };
}

const hashTerm = (term, buckets) => {
    let hash = 2166136261;
    for (const character of term) {
        hash ^= character.codePointAt(0);
        hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % buckets;
};

const encodeTerms = (text, vocabulary) => {
    const terms = new Set(tokenize(text));
    const hashedTerms = new Array(vocabulary.hashBuckets).fill(0);
    for (const term of terms) {
        hashedTerms[hashTerm(term, vocabulary.hashBuckets)] = 1;
    }
    return [
        ...vocabulary.terms.map(term => Number(terms.has(term))),
        ...hashedTerms
    ];
};

const encodeContext = (context, vocabulary) => [
    ...encodeTerms(contextText(context), vocabulary),
    ...vocabulary.priorities.map(() => 0),
    ...vocabulary.testTypes.map(() => 0)
];

const encodeTestCase = (testCase, vocabulary) => [
    ...encodeTerms(testCaseText(testCase), vocabulary),
    ...vocabulary.priorities.map(priority => Number(testCase.priority === priority)),
    ...vocabulary.testTypes.map(type => Number(testCase.testType === type))
];

const combine = (contextVector, testCaseVector) => [
    ...contextVector,
    ...testCaseVector
];

export function createTrainingData(tf, testCases, history, vocabulary) {
    const casesById = new Map(testCases.map(testCase => [testCase.id, testCase]));
    const inputs = [];
    const labels = [];

    for (const change of history) {
        if (!Array.isArray(change.selectedTestCaseIds) || change.selectedTestCaseIds.length === 0) {
            continue;
        }
        const unknownIds = change.selectedTestCaseIds.filter(id => !casesById.has(id));
        if (unknownIds.length > 0) {
            throw new Error(`Change history references unknown test case IDs: ${unknownIds.join(', ')}.`);
        }
        const selectedIds = new Set(change.selectedTestCaseIds);
        const contextVector = encodeContext(change, vocabulary);

        for (const testCase of testCases) {
            inputs.push(combine(contextVector, encodeTestCase(testCase, vocabulary)));
            labels.push(Number(selectedIds.has(testCase.id)));
        }
    }

    if (inputs.length === 0 || !labels.includes(1) || !labels.includes(0)) {
        throw new Error('Change history must contain selected test cases and negative examples to train the recommender.');
    }

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        inputDimension: inputs[0].length
    };
}

export async function trainModel(tf, trainingData, onEpochEnd = () => {}) {
    const model = tf.sequential();
    model.add(tf.layers.dense({
        inputShape: [trainingData.inputDimension],
        units: 128,
        activation: 'relu'
    }));
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({
        optimizer: tf.train.adam(0.01),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
    });

    await model.fit(trainingData.xs, trainingData.ys, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        callbacks: { onEpochEnd }
    });

    trainingData.xs.dispose();
    trainingData.ys.dispose();
    return model;
}

export function recommendTestCases(tf, model, context, testCases, vocabulary) {
    const contextVector = encodeContext(context, vocabulary);
    const vectors = testCases.map(testCase =>
        combine(contextVector, encodeTestCase(testCase, vocabulary))
    );
    const inputTensor = tf.tensor2d(vectors);
    const prediction = model.predict(inputTensor);
    const modelScores = prediction.dataSync();
    inputTensor.dispose();
    prediction.dispose();

    const documents = testCases.map(testCase => new Set(tokenize(testCaseText(testCase))));
    const documentFrequency = new Map();
    for (const terms of documents) {
        for (const term of terms) {
            documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
        }
    }

    const termWeights = value => {
        const weights = new Map();
        for (const term of new Set(tokenize(value))) {
            if (documentFrequency.has(term)) {
                weights.set(term, 1 + Math.log(
                    (testCases.length + 1) / (documentFrequency.get(term) + 1)
                ));
            }
        }
        return weights;
    };
    const contextWeights = termWeights([
        context.branch,
        context.title,
        context.description,
        ...(context.commitMessages ?? [])
    ].filter(Boolean).join(' '));
    const fileWeights = termWeights((context.changedFiles ?? []).join(' '));
    const hasFileEvidence = fileWeights.size > 0;
    const historyMatches = vocabulary.history ?? [];
    const maxModelScore = Math.max(...modelScores);
    const minModelScore = Math.min(...modelScores);
    const modelScoreRange = maxModelScore - minModelScore;
    const normalizedModelScores = modelScores.map(score =>
        modelScoreRange === 0 ? 0 : (score - minModelScore) / modelScoreRange
    );

    const weightedOverlap = (weights, terms) => {
        const totalWeight = [...weights.values()].reduce((total, weight) => total + weight, 0);
        if (totalWeight === 0) {
            return 0;
        }
        let matchedWeight = 0;
        for (const [term, weight] of weights) {
            if (terms.has(term)) {
                matchedWeight += weight;
            }
        }
        return matchedWeight / totalWeight;
    };

    return testCases.map((testCase, index) => {
        const terms = documents[index];
        const matchingContextTerms = [...contextWeights.keys()].filter(term => terms.has(term));
        const matchingFileTerms = [...fileWeights.keys()].filter(term => terms.has(term));
        const contextScore = weightedOverlap(contextWeights, terms);
        const fileScore = weightedOverlap(fileWeights, terms);
        let historyScore = 0;
        let matchingHistory;

        for (const entry of historyMatches) {
            const similarity = weightedOverlap(contextWeights, new Set(tokenize(contextText(entry))));
            if (similarity > historyScore && entry.selectedTestCaseIds.includes(testCase.id)) {
                historyScore = similarity;
                matchingHistory = entry;
            }
        }

        const score = hasFileEvidence
            ? fileScore * 0.75
                + contextScore * 0.18
                + historyScore * 0.05
                + normalizedModelScores[index] * 0.02
            : contextScore * 0.82
                + historyScore * 0.10
                + normalizedModelScores[index] * 0.08;
        const reasons = [];
        if (matchingFileTerms.length > 0) {
            reasons.push(`arquivos alterados correspondem a ${[...new Set(matchingFileTerms)].slice(0, 5).join(', ')}`);
        }
        if (matchingContextTerms.length > 0) {
            reasons.push(`contexto do PR corresponde a ${[...new Set(matchingContextTerms)].slice(0, 5).join(', ')}`);
        }
        if (matchingHistory) {
            reasons.push(`histórico semelhante: ${matchingHistory.title}`);
        }
        const reason = reasons.length > 0
            ? `Recomendado porque ${reasons.join('; ')}.`
            : 'Sem correspondência direta com os termos do PR ou arquivos alterados; posição baseada no modelo treinado.';

        return { ...testCase, score, reason };
    }).sort((left, right) => right.score - left.score);
}

export function getContextTerms(context) {
    return tokenize(contextText(context));
}
