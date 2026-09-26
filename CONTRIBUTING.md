# Contributing to Yahmi Security Rover

Thank you for your interest in contributing to Yahmi Security Rover! We welcome contributions from the community to help make this autonomous surveillance rover robust, secure, and performant.

---

## 🧭 Code of Conduct

Please treat everyone with respect, adhere to constructive feedback, and maintain professional standards across issues and pull requests.

---

## 🌿 Git Branching Strategy

We follow a Git Flow style development model:

| Branch | Description |
|---|---|
| `main` | Production-ready stable code. Only releases and hotfixes merge here. |
| `develop` | Active integration branch. All features merge into `develop`. |
| `feature/<name>` | New feature branches cut from `develop` (e.g. `feature/thermal-vision`). |
| `fix/<name>` | Bug fix branches (e.g. `fix/websocket-reconnect`). |
| `release/<version>` | Release preparation branches (e.g. `release/v1.1.0`). |

### Workflow Steps
1. Fork the repository and clone your fork.
2. Create a branch off `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-new-feature
   ```
3. Commit your changes following **Conventional Commits**.
4. Push your branch and open a Pull Request against `develop`.

---

## 💬 Commit Message Guidelines

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```

### Allowed Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes only
- `style`: Changes that do not affect the meaning of code (whitespace, formatting)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, tooling, or auxiliary dependencies
- `ci`: Changes to CI/CD configuration files and scripts

### Examples:
- `feat(rover): add ultrasonic obstacle avoidance routine`
- `fix(dashboard): resolve websocket disconnection on sleep`
- `docs(api): update authentication endpoints documentation`

---

## 🛠️ Local Development Setup

### Web Dashboard
```bash
cd web_dashboard
npm install
npm run dev
```

### Raspberry Pi Firmware
```bash
cd raspberry_pi_firmware
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Firmware Tests & Linting
Run tests and style checks before submitting PRs:
```bash
# In web_dashboard
npm run lint
npm run test:coverage
```

---

## 📋 Pull Request Requirements

1. **Tests**: Every new feature or bug fix must be accompanied by automated unit or integration tests.
2. **Linting**: Ensure code passes ESLint, Prettier, and Flake8 without errors.
3. **Documentation**: Update markdown documents in `/docs` when changing architecture, APIs, or configuration.
4. **Code Review**: At least one approval from a CODEOWNER is required before merging.
