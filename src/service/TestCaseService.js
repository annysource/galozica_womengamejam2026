export class TestCaseService {
    async getTestCases() {
        const response = await fetch('./data/test-cases.json');
        if (!response.ok) {
            throw new Error(`Unable to load test cases: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }

    async getChangeHistory() {
        const response = await fetch('./data/change-history.json');
        if (!response.ok) {
            throw new Error(`Unable to load change history: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
}
