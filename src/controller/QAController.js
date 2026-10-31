export class QAController {
    #service;
    #view;
    #worker;
    #isTrained = false;

    constructor({ service, view, worker }) {
        this.#service = service;
        this.#view = view;
        this.#worker = worker;
        this.#view.registerTrainCallback(this.train.bind(this));
        this.#view.registerRecommendCallback(this.recommend.bind(this));
        this.#worker.onmessage = this.handleWorkerMessage.bind(this);
        this.#worker.onerror = event => this.#view.showError(event.message);
    }

    async train() {
        try {
            const history = await this.#service.getChangeHistory();
            this.#isTrained = false;
            this.#view.setTrainingState('Treinando o recomendador TensorFlow…', true);
            this.#worker.postMessage({ action: 'train', history });
        } catch (error) {
            this.#view.showError(error.message);
        }
    }

    recommend(context) {
        if (!this.#isTrained) {
            this.#view.showError('Treine o modelo antes de recomendar casos de teste.');
            return;
        }
        if (!context.title && !context.description && !context.branch && context.commitMessages.length === 0) {
            this.#view.showError('Informe ao menos um campo de contexto do Pull Request.');
            return;
        }
        this.#worker.postMessage({ action: 'recommend', context });
    }

    handleWorkerMessage({ data }) {
        switch (data.type) {
            case 'progress':
                this.#view.setTrainingState(`Treinando o recomendador TensorFlow… ${data.progress}%`, true);
                break;
            case 'training-complete':
                this.#isTrained = true;
                this.#view.setTrained();
                break;
            case 'recommendations-ready':
                this.#view.renderRecommendations(data.recommendations);
                break;
            case 'error':
                this.#isTrained = false;
                this.#view.showError(data.message);
                break;
            default:
                break;
        }
    }
}
