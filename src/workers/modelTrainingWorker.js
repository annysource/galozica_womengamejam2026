import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import {
    createTrainingData,
    createVocabulary,
    recommendTestCases,
    trainModel
} from '../service/RecommendationModel.js';

let model;
let testCases;
let vocabulary;

async function train({ history }) {
    testCases = await (await fetch('/data/test-cases.json')).json();
    vocabulary = createVocabulary(testCases, history);
    const trainingData = createTrainingData(tf, testCases, history, vocabulary);
    postMessage({ type: 'progress', progress: 5 });
    model = await trainModel(tf, trainingData, epoch => {
        postMessage({ type: 'progress', progress: Math.round(((epoch + 1) / 100) * 90) + 5 });
    });
    postMessage({ type: 'training-complete' });
}

function recommend({ context }) {
    if (!model || !vocabulary) {
        throw new Error('Train the model before requesting recommendations.');
    }
    const recommendations = recommendTestCases(tf, model, context, testCases, vocabulary);
    postMessage({ type: 'recommendations-ready', recommendations });
}

self.onmessage = async ({ data }) => {
    try {
        if (data.action === 'train') {
            await train(data);
        } else if (data.action === 'recommend') {
            recommend(data);
        }
    } catch (error) {
        postMessage({ type: 'error', message: error.message });
    }
};
