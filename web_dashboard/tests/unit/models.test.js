const User = require('../../models/User');
const ControlCommand = require('../../models/ControlCommand');
const SystemStatus = require('../../models/SystemStatus');

describe('Database Model Schema Validations', () => {
  describe('User Model', () => {
    test('requires username and password fields', () => {
      const user = new User({});
      const error = user.validateSync();
      
      expect(error.errors.username).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    test('validates valid user structure', () => {
      const user = new User({
        username: 'commander',
        password: 'securePassword123!',
        email: 'commander@yahmi.cloud',
        role: 'admin',
      });
      const error = user.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('ControlCommand Model', () => {
    test('validates required fields', () => {
      const command = new ControlCommand({
        command: 'MOVE_FORWARD',
        parameters: { speed: 80, duration: 1000 },
        source: 'web_dashboard',
      });
      const error = command.validateSync();
      expect(error).toBeUndefined();
    });
  });

  describe('SystemStatus Model', () => {
    test('validates system status payload correctly', () => {
      const status = new SystemStatus({
        roverId: 'ROVER-01',
        online: true,
        battery: 88,
        temperature: 32.5,
        mode: 'patrol',
      });
      const error = status.validateSync();
      expect(error).toBeUndefined();
    });
  });
});
