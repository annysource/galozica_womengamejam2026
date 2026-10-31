import * as tf from '@tensorflow/tfjs-node';

export class RecommendationModel {
  constructor() {
    this.model = null;
    this.allFiles = [];
    this.allTestCases = [];
  }

  createTrainingData(changeHistory, testCases) {
    const fileSet = new Set();
    const testCaseSet = new Set(testCases.map(tc => tc.id));

    changeHistory.forEach(entry => {
      entry.files.forEach(f => fileSet.add(f));
      entry.testCases.forEach(id => {
        if (!testCaseSet.has(id)) {
          throw new Error(Change history references unknown test case ID: \);
        }
      });
    });

    this.allFiles = Array.from(fileSet);
    this.allTestCases = Array.from(testCaseSet);

    const inputs = [];
    const labels = [];

    changeHistory.forEach(entry => {
      const inputVector = this.allFiles.map(f => entry.files.includes(f) ? 1 : 0);
      const selectedSet = new Set(entry.testCases);

      this.allTestCases.forEach((tcId, index) => {
        const isSelected = selectedSet.has(tcId);
        inputs.push([...inputVector, index]);
        labels.push(isSelected ? 1 : 0);
      });
    });

    const hasPositive = labels.includes(1);
    const hasNegative = labels.includes(0);

    // Fallback de seguranca caso o historico seja pequeno
    if (!hasPositive || !hasNegative) {
      inputs.push([...new Array(this.allFiles.length).fill(0), 0]);
      labels.push(hasPositive ? 0 : 1);
    }

    return {
      xs: tf.tensor2d(inputs, [inputs.length, this.allFiles.length + 1]),
      ys: tf.tensor2d(labels, [labels.length, 1])
    };
  }

  async train(changeHistory, testCases) {
    const { xs, ys } = this.createTrainingData(changeHistory, testCases);

    this.model = tf.sequential();
    this.model.add(tf.layers.dense({
      inputShape: [this.allFiles.length + 1],
      units: 16,
      activation: 'relu'
    }));
    this.model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    this.model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid'
    }));

    this.model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy']
    });

    await this.model.fit(xs, ys, {
      epochs: 20,
      verbose: 0
    });

    xs.dispose();
    ys.dispose();
  }

  async predict(changedFiles, testCases) {
    if (!this.model) {
      throw new Error('Model must be trained before prediction.');
    }

    const inputVector = this.allFiles.map(f => changedFiles.includes(f) ? 1 : 0);
    const predictions = [];

    for (let i = 0; i < this.allTestCases.length; i++) {
      const input = tf.tensor2d([[...inputVector, i]]);
      const pred = this.model.predict(input);
      const score = (await pred.data())[0];
      
      predictions.push({
        testCaseId: this.allTestCases[i],
        score
      });

      input.dispose();
      pred.dispose();
    }

    predictions.sort((a, b) => b.score - a.score);
    return predictions;
  }
}