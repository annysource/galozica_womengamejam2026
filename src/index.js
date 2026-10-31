import { QAController } from './controller/QAController.js';
import { TestCaseService } from './service/TestCaseService.js';
import { ChecklistView } from './view/ChecklistView.js';

const controller = new QAController({
    service: new TestCaseService(),
    view: new ChecklistView(),
    worker: new Worker('/src/workers/modelTrainingWorker.js', { type: 'module' })
});

controller.train();
