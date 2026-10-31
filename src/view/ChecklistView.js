export class ChecklistView {
    #form = document.querySelector('#prContextForm');
    #trainButton = document.querySelector('#trainModelBtn');
    #recommendButton = document.querySelector('#runRecommendationBtn');
    #status = document.querySelector('#status');
    #results = document.querySelector('#recommendations');
    #onTrain;
    #onRecommend;

    constructor() {
        this.#form.addEventListener('submit', event => {
            event.preventDefault();
            this.#onRecommend?.(this.getContext());
        });
        this.#trainButton.addEventListener('click', () => this.#onTrain?.());
    }

    registerTrainCallback(callback) {
        this.#onTrain = callback;
    }

    registerRecommendCallback(callback) {
        this.#onRecommend = callback;
    }

    getContext() {
        const formData = new FormData(this.#form);
        return {
            branch: formData.get('branch').trim(),
            title: formData.get('title').trim(),
            description: formData.get('description').trim(),
            commitMessages: formData.get('commitMessages')
                .split(/\r?\n/)
                .map(message => message.trim())
                .filter(Boolean)
        };
    }

    setTrainingState(message, isTraining) {
        this.#status.textContent = message;
        this.#trainButton.disabled = isTraining;
        this.#recommendButton.disabled = isTraining;
    }

    setTrained() {
        this.#trainButton.disabled = false;
        this.#recommendButton.disabled = false;
        this.#status.textContent = 'Modelo treinado. Informe o contexto do PR para gerar o checklist.';
    }

    showError(message) {
        this.#status.textContent = `Erro: ${message}`;
        this.#status.classList.add('text-danger');
        this.#trainButton.disabled = false;
    }

    renderRecommendations(recommendations) {
        this.#results.replaceChildren();
        if (recommendations.length === 0) {
            this.#results.textContent = 'Nenhum caso de teste disponível.';
            return;
        }

        for (const [index, testCase] of recommendations.entries()) {
            const article = document.createElement('article');
            article.className = 'card mb-3';
            const body = document.createElement('div');
            body.className = 'card-body';

            const heading = document.createElement('h3');
            heading.className = 'h5';
            heading.textContent = `${index + 1}. ${testCase.id} — ${testCase.functionality}`;
            body.append(heading);

            const meta = document.createElement('p');
            meta.className = 'text-muted mb-2';
            meta.textContent = `${testCase.component} · ${testCase.priority} · ${testCase.testType}`;
            body.append(meta);

            const reason = document.createElement('p');
            reason.textContent = testCase.reason;
            body.append(reason);

            const objective = document.createElement('p');
            objective.textContent = `Objetivo: ${testCase.objective}`;
            body.append(objective);

            const preconditions = document.createElement('p');
            preconditions.textContent = `Pré-condições: ${testCase.preconditions.join(' · ')}`;
            body.append(preconditions);

            const steps = document.createElement('ol');
            steps.setAttribute('aria-label', `Passos do caso ${testCase.id}`);
            for (const step of testCase.steps) {
                const listItem = document.createElement('li');
                listItem.textContent = step;
                steps.append(listItem);
            }
            body.append(steps);

            const scenario = document.createElement('pre');
            scenario.className = 'gherkin';
            scenario.textContent = [
                `Feature: ${testCase.gherkin.feature}`,
                '',
                `Scenario: ${testCase.gherkin.scenario}`,
                `  Given ${testCase.gherkin.given}`,
                `  When ${testCase.gherkin.when}`,
                `  Then ${testCase.gherkin.then}`
            ].join('\n');
            body.append(scenario);

            const expected = document.createElement('p');
            expected.textContent = `Resultado esperado: ${testCase.expectedResult}`;
            body.append(expected);

            const execution = document.createElement('label');
            execution.className = 'form-label';
            execution.textContent = 'Acompanhamento da QA ';
            const select = document.createElement('select');
            select.className = 'form-select';
            select.setAttribute('aria-label', `Resultado da execução ${testCase.id}`);
            for (const value of ['Não executado', 'Aprovado', 'Reprovado', 'Bloqueado']) {
                const option = document.createElement('option');
                option.textContent = value;
                select.append(option);
            }
            execution.append(select);
            body.append(execution);
            article.append(body);
            this.#results.append(article);
        }
    }
}
