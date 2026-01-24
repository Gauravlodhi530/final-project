// Test setup file
beforeAll(() => {
  // Suppress console logs during tests if needed
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  // Restore console
  console.log.mockRestore();
  console.error.mockRestore();
});
