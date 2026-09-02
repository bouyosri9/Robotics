# Contributing Guidelines

Thank you for your interest in contributing to the Robot Collaborative Simulator! This document outlines how to contribute effectively.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## Getting Started

### 1. Fork & Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/your-username/robot-collaborative-simulator.git
cd robot-collaborative-simulator
git remote add upstream https://github.com/original-repo/robot-collaborative-simulator.git
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Test improvements

### 3. Setup Development Environment

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

## Making Changes

### Code Style

**JavaScript:**
```javascript
// ✅ Good
const calculateTcp = (joints) => {
  const { j1, j2, j3 } = joints;
  return { x: 0, y: 0, z: 0 };
};

// ❌ Avoid
var calculateTcp = function(joints) {
  return { x: 0, y: 0, z: 0 };
};
```

**React Components:**
```jsx
// ✅ Good - Functional component with hooks
export default function RobotSimulator({ selectedRobot }) {
  const [state, setState] = useState(null);
  const { state: robotState } = useRobotSocket();
  
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, []);
  
  return <div>{/* JSX */}</div>;
}

// ❌ Avoid - Class components (unless necessary)
class RobotSimulator extends React.Component {
  // ...
}
```

### Commit Messages

Format: `<type>: <subject>`

```bash
git commit -m "feat: add inverse kinematics solver"
git commit -m "fix: resolve WebSocket reconnection issue"
git commit -m "docs: update API documentation"
git commit -m "refactor: simplify kinematics calculation"
git commit -m "test: add robot engine tests"
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `refactor` - Code refactoring
- `test` - Tests
- `chore` - Build, dependencies, etc.

**Subject line:**
- 50 characters max
- Lowercase
- Imperative mood ("add" not "adds" or "added")
- No period at the end

### Detailed Commit Body (Optional)

```bash
git commit -m "fix: resolve TCP calculation error

The TCP position was incorrectly calculated when J2 > 0.
This fix applies the correct sign convention for vertical reach.

Fixes #42"
```

## Testing

### Before Submitting

1. **Test Manually:**
   ```bash
   # Frontend
   npm run lint
   
   # Backend - test API endpoints
   curl http://localhost:4000/api/state
   curl -X POST http://localhost:4000/api/command -H "Content-Type: application/json" -d '{"command":"start"}'
   ```

2. **Check Console:**
   - No warnings or errors
   - Verify WebSocket connection works
   - Test all modified features

3. **Test on Different Browsers:**
   - Chrome/Edge (Chromium-based)
   - Firefox
   - Safari

### Writing Tests (When Applicable)

**Backend Test Example:**
```javascript
// backend/__tests__/robotEngine.test.js
import { RobotEngine } from '../src/robotEngine';

describe('RobotEngine', () => {
  let engine;
  
  beforeEach(() => {
    engine = new RobotEngine();
  });
  
  test('should calculate TCP correctly', () => {
    engine.joints = { j1: 0, j2: -50, j3: 70, j4: -40, j5: 45, j6: 0 };
    const tcp = engine.computeTcp();
    expect(tcp.z).toBeGreaterThan(500);
  });
  
  test('should respect joint limits', () => {
    engine.setTarget({ j1: 200 });  // Out of range
    // Should not accept or should clamp
  });
});
```

**Frontend Test Example:**
```javascript
// frontend/__tests__/forwardKinematics.test.js
import { computeTCP } from '../src/forwardKinematics';

describe('Forward Kinematics', () => {
  test('should compute TCP for home pose', () => {
    const tcp = computeTCP({ j1: 0, j2: -50, j3: 70, j4: -40, j5: 45, j6: 0 });
    expect(tcp.x).toBeCloseTo(0, 1);
    expect(tcp.z).toBeGreaterThan(500);
  });
});
```

## Pull Request Process

### 1. Sync with Upstream

```bash
git fetch upstream
git rebase upstream/main
# Resolve any conflicts
```

### 2. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

**On GitHub:**
- Click "Compare & pull request"
- Fill out the PR template (if available)
- Reference related issues: `Closes #42`

**PR Title:** `feat: add inverse kinematics solver`

**PR Description:**
```markdown
## Changes
- Implemented analytical IK solver using JAKA specifications
- Added endpoint: POST /api/inverse-kinematics
- Updates RobotSimulator UI with IK mode toggle

## Testing
- Tested with home and demo poses
- Verified joint limits respected
- No WebSocket disruptions

## Screenshots (if applicable)
[Screenshot of new UI feature]

## Checklist
- [x] Tests pass
- [x] Code follows style guide
- [x] Documentation updated
- [x] No breaking changes
```

### 4. Address Review Comments

- Be responsive to feedback
- Request clarification if unclear
- Update your PR with requested changes
- Use "Resolve conversation" after fixing

### 5. Merge

Once approved, maintainer will merge your PR. Your feature is now part of the project!

## Types of Contributions

### Bug Reports 🐛

**Before reporting, check:**
- Is this already reported in Issues?
- Can you reproduce it consistently?
- What is your environment (OS, browser, Node version)?

**Template:**
```markdown
**Description:**
Brief description of the bug.

**Steps to Reproduce:**
1. Start backend with `npm run dev`
2. Open frontend at localhost:5173
3. Move J1 slider to 180°
4. Bug occurs

**Expected Behavior:**
Robot rotates to 180°

**Actual Behavior:**
Robot stops at 170°

**Environment:**
- OS: Windows 11
- Browser: Chrome 120
- Node: v20.0.0
```

### Feature Requests ✨

**Template:**
```markdown
**Problem:**
Describe the problem or limitation.

**Solution:**
Describe your proposed solution.

**Alternatives Considered:**
Any other approaches?

**Example Use Case:**
How would this feature be used?
```

### Documentation 📚

- Fix typos
- Improve clarity
- Add examples
- Translate documentation (future)

### Code Reviews 🔍

- Review open PRs
- Provide constructive feedback
- Test changes locally
- Verify against requirements

## Documentation Standards

### Code Comments

```javascript
// ✅ Good - explain WHY, not WHAT
// Use constant velocity instead of percentage-based motion
// to ensure predictable animation timing across browsers
const SPEED_DEG_PER_TICK = 1.2;

// ❌ Avoid - obvious from code
// Set speed to 1.2
const SPEED_DEG_PER_TICK = 1.2;
```

### Function Documentation

```javascript
/**
 * Computes TCP position using forward kinematics
 * @param {Object} joints - Joint angles in degrees
 * @param {number} joints.j1 - Base rotation (-180 to 180)
 * @param {number} joints.j2 - Shoulder angle (-180 to 180)
 * @param {number} joints.j3 - Elbow angle (-170 to 170)
 * @returns {Object} TCP position {x, y, z} in mm
 * @throws {Error} If joints are invalid
 */
computeTcp(joints) {
  // Implementation
}
```

### README Updates

When adding features, update relevant documentation:
- `README.md` - Overview changes
- `ARCHITECTURE.md` - System design changes
- `API_DOCUMENTATION.md` - New endpoints
- `DEVELOPMENT.md` - Developer workflow
- Inline code comments

## Performance & Security

### Performance Checklist

- [ ] No unnecessary re-renders (React)
- [ ] WebSocket messages are efficient (< 1KB typical)
- [ ] No blocking operations on main thread
- [ ] Kinematics calculations cached if needed
- [ ] No memory leaks (cleanup on unmount)

### Security Checklist

- [ ] Input validation on all endpoints
- [ ] Joint limits enforced
- [ ] CORS properly configured
- [ ] No sensitive data in logs
- [ ] WebSocket messages validated

## Questions?

### Getting Help

1. **Documentation:** Check [DEVELOPMENT.md](DEVELOPMENT.md) and [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. **Issues:** Search existing GitHub issues
3. **Discussions:** Create a GitHub Discussion
4. **Email:** Contact maintainers

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file (to be created)
- GitHub commit history
- Release notes

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (see LICENSE file).

## Thank You! 🙏

Your contributions help make this project better for everyone. We truly appreciate your effort and dedication!

---

**Happy Contributing!**

For detailed technical information, see [DEVELOPMENT.md](DEVELOPMENT.md)
