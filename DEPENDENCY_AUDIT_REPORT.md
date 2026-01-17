# NetSuite Project - Dependency Audit Report
**Date:** 2026-01-17
**Total Dependencies:** 460 packages (11 direct)
**Total Size:** 118MB
**Security Issues:** 5 vulnerabilities (1 high, 4 low)

---

## Executive Summary

This audit identified **critical security vulnerabilities**, **severely outdated packages**, and **significant dependency bloat** that should be addressed immediately. Key findings:

- **HIGH PRIORITY**: Axios has critical CSRF and SSRF security vulnerabilities
- NetSuite type definitions are 3 years out of date
- Using deprecated packages (moment.js, ESLint 8)
- 118MB of dependencies, much of which is unnecessary for NetSuite development

---

## 1. Security Vulnerabilities

### 🔴 HIGH SEVERITY

#### Axios (v0.27.2) - CRITICAL
**CVEs:**
- GHSA-wf5p-g6vw-rhxx: Cross-Site Request Forgery Vulnerability
- GHSA-jr5f-v2jv-69x6: SSRF and Credential Leakage via Absolute URL

**Impact:** These vulnerabilities could allow attackers to:
- Forge requests from authenticated users (CSRF)
- Access internal resources or leak credentials (SSRF)

**Fix:** Upgrade to axios@1.13.2
```bash
npm install axios@latest
```

**Risk:** Currently on v0.27.2, latest is v1.13.2 (major version behind)

### 🟡 LOW SEVERITY

#### tmp package
**CVE:** GHSA-52f5-9888-hmc6
**Impact:** Symbolic link vulnerability in temporary file/directory creation
**Affected:** Only impacts @oracle/suitecloud-cli (optional dependency)
**Status:** Low risk as Oracle CLI is optional and not currently installed

---

## 2. Outdated Packages

### Critical Updates Needed

| Package | Current | Latest | Gap | Priority |
|---------|---------|--------|-----|----------|
| **@hitc/netsuite-types** | 2022.2.17 | 2025.2.11 | 3 years | 🔴 CRITICAL |
| **eslint** | 8.57.1 | 9.39.2 | Deprecated | 🔴 CRITICAL |
| **typescript** | 4.9.5 | 5.9.3 | Major version | 🟠 HIGH |
| **axios** | 0.27.2 | 1.13.2 | Security risk | 🔴 CRITICAL |
| **@types/node** | 18.19.130 | 25.0.9 | 7 versions | 🟠 HIGH |
| **jest** | 29.7.0 | 30.2.0 | Major version | 🟡 MEDIUM |
| **@types/jest** | 29.5.14 | 30.0.0 | Minor | 🟡 MEDIUM |

### Why These Updates Matter

**@hitc/netsuite-types (2022.2.17 → 2025.2.11)**
- Missing 3 years of NetSuite API updates
- Likely missing new SuiteScript 2.1 features
- Type definitions may not match current NetSuite environment
- **Action:** MUST UPDATE for accurate type checking

**eslint (8.57.1 → 9.39.2)**
- Version 8 is officially **no longer supported**
- Missing security patches and bug fixes
- ESLint 9 has flat config system (breaking change)
- **Action:** Update with config migration

**TypeScript (4.9.5 → 5.9.3)**
- Missing significant performance improvements
- Lacking newer type system features
- Better module resolution in v5
- **Action:** Update (likely no breaking changes for this codebase)

---

## 3. Deprecated & Problematic Dependencies

### 🚫 Actively Deprecated

#### moment.js (4.4MB)
**Status:** Project is in maintenance mode (no new features since 2020)
**Issue:**
- Large bundle size (4.4MB - second largest dependency!)
- Mutable API prone to bugs
- Not tree-shakeable

**Recommendation:** Replace with modern alternatives

**Options:**
1. **date-fns** (Recommended for NetSuite)
   - Tree-shakeable (import only what you need)
   - Immutable
   - ~200KB vs 4.4MB
   ```bash
   npm install date-fns
   npm uninstall moment
   ```

2. **Native JavaScript Intl API**
   - Zero dependencies
   - Built into modern browsers/Node.js
   - Best for simple date formatting

**Migration effort:** Low-Medium (depending on moment usage)

#### ESLint 8.x
**Status:** No longer supported
**Issue:** Security vulnerabilities won't be patched
**Action Required:** Migrate to ESLint 9.x

```bash
npm install eslint@latest eslint-config-airbnb-base@latest
```

**Note:** ESLint 9 uses flat config format - will need config file updates

---

## 4. Dependency Bloat Analysis

### Size Breakdown

| Category | Size | Percentage | Assessment |
|----------|------|------------|------------|
| TypeScript | 64MB | 54% | ✅ Necessary |
| Babel | 8.7MB | 7% | ❌ Likely unnecessary |
| Moment.js | 4.4MB | 4% | ❌ Should replace |
| ESLint | 3.1MB | 3% | ✅ Necessary (update needed) |
| Lodash | 1.7MB | 1% | ⚠️ Partially unnecessary |
| Other | 35MB | 31% | ✅ Mostly necessary |

### Bloat Recommendations

#### 1. Remove Babel (@babel - 8.7MB)
**Why it's here:** Pulled in by Jest
**Do you need it?** Probably not for NetSuite development

NetSuite runs SuiteScript (ES2019+), and you're using TypeScript which compiles to ES2019. Babel is redundant.

**Action:**
- Keep using TypeScript for compilation
- Configure Jest to use `ts-jest` instead of Babel
- **Potential savings:** 8.7MB

#### 2. Replace/Reduce Lodash usage (1.7MB)
**Issue:** Modern JavaScript (ES6+) has native equivalents for many Lodash functions

**Common Lodash → Native replacements:**
```javascript
// Lodash
_.map(array, fn)          → array.map(fn)
_.filter(array, fn)       → array.filter(fn)
_.includes(array, item)   → array.includes(item)
_.assign(obj1, obj2)      → Object.assign(obj1, obj2) or {...obj1, ...obj2}
_.keys(obj)               → Object.keys(obj)
_.values(obj)             → Object.values(obj)
```

**Keep Lodash for:**
- Deep cloning (`_.cloneDeep`)
- Complex object manipulation (`_.get`, `_.set`)
- Debounce/throttle (or use separate small packages)

**Action:** Use `lodash-es` with tree-shaking or cherry-pick imports
```bash
npm install lodash-es
# Then import only what you need
import debounce from 'lodash-es/debounce';
```

**Potential savings:** 1-1.5MB

#### 3. Review axios in Dependencies
**Issue:** Axios is listed as a production dependency, but NetSuite SuiteScripts cannot make arbitrary HTTP requests from the client side.

**Questions to consider:**
- Are you making external API calls from SuiteScripts?
- If so, use NetSuite's native modules: `N/http` or `N/https`
- Axios adds unnecessary bloat if you're not using it

**For NetSuite development:**
```javascript
// Instead of axios, use NetSuite's native module
define(['N/https'], function(https) {
    var response = https.get({
        url: 'https://api.example.com/data'
    });
    return response.body;
});
```

**Action:** Remove axios entirely if using NetSuite's HTTP modules
**Savings:** Removes security vulnerability + reduces bundle size

---

## 5. Unnecessary Dependencies for NetSuite

### Dependencies That May Not Be Needed

#### axios (Production Dependency)
- **Current:** Production dependency
- **Issue:** NetSuite has built-in HTTP modules (`N/http`, `N/https`)
- **Recommendation:** Remove unless calling external APIs from Node.js scripts
- **Impact:** Eliminates HIGH security vulnerability

#### lodash (Production Dependency)
- **Current:** Production dependency
- **Issue:** Most functionality available in modern JavaScript
- **Recommendation:** Replace with native JS or cherry-pick specific functions
- **Impact:** Reduces bundle size significantly

#### moment (Production Dependency)
- **Current:** Production dependency
- **Issue:** Deprecated, large size, NetSuite has date handling
- **Recommendation:** Use date-fns or native JavaScript Date/Intl
- **Impact:** Saves 4.4MB, removes deprecated dependency

---

## 6. Recommended Actions

### Immediate (This Week)

#### 1. Fix Security Vulnerabilities
```bash
# Update axios to latest
npm install axios@latest

# Or remove if not needed for NetSuite
npm uninstall axios
```

#### 2. Update NetSuite Types
```bash
npm install @hitc/netsuite-types@latest
```

#### 3. Update Critical Dev Dependencies
```bash
npm install typescript@latest
npm install @types/node@latest
npm install @types/jest@latest
npm install jest@latest
```

### Short Term (This Month)

#### 4. Migrate from ESLint 8 to 9
```bash
npm install eslint@latest
# Update .eslintrc to flat config format
# Test linting rules
```

#### 5. Replace moment.js with date-fns
```bash
npm install date-fns
npm uninstall moment
# Refactor code to use date-fns
```

#### 6. Optimize Lodash Usage
```bash
npm install lodash-es
# Refactor to use specific imports or native JS
```

### Medium Term (Next Quarter)

#### 7. Review Production Dependencies
- Audit if axios, lodash, moment are actually used in production code
- Remove any dependencies that aren't deployed to NetSuite
- Keep only dependencies that are truly needed

#### 8. Set Up Automated Dependency Management
```bash
# Add to package.json scripts
"scripts": {
  "audit": "npm audit",
  "outdated": "npm outdated",
  "update-check": "npm outdated && npm audit"
}
```

Consider using:
- **Dependabot** (GitHub) - Automated dependency updates
- **Snyk** - Continuous security monitoring
- **npm-check-updates** - Easy package updates

---

## 7. Proposed Updated package.json

### Recommended Configuration

```json
{
  "name": "netsuite-project",
  "version": "1.0.0",
  "description": "NetSuite SuiteScript development project",
  "main": "index.js",
  "scripts": {
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "build": "tsc",
    "audit:security": "npm audit",
    "audit:outdated": "npm outdated",
    "audit:full": "npm outdated && npm audit"
  },
  "keywords": ["netsuite", "suitescript", "erp"],
  "author": "",
  "license": "ISC",
  "devDependencies": {
    "@hitc/netsuite-types": "^2025.2.11",
    "@types/jest": "^30.0.0",
    "@types/node": "^25.0.9",
    "eslint": "^9.39.2",
    "eslint-config-airbnb-base": "^16.0.0",
    "eslint-plugin-import": "^2.32.0",
    "jest": "^30.2.0",
    "ts-jest": "^30.0.0",
    "typescript": "^5.9.3"
  },
  "dependencies": {
    "date-fns": "^4.1.0"
  },
  "optionalDependencies": {
    "@oracle/suitecloud-cli": "^3.1.2"
  }
}
```

### Changes Made:
1. ✅ Updated all packages to latest versions
2. ✅ Replaced moment with date-fns
3. ✅ Removed axios (use NetSuite's N/https)
4. ✅ Removed lodash (use native JS)
5. ✅ Added ts-jest for better TypeScript support
6. ✅ Updated Oracle SuiteCloud CLI to latest
7. ✅ Added audit scripts

---

## 8. Migration Checklist

### Phase 1: Security & Critical Updates
- [ ] Update axios to v1.13.2 OR remove if unused
- [ ] Update @hitc/netsuite-types to 2025.2.11
- [ ] Update TypeScript to v5.9.3
- [ ] Update @types/node to v25.0.9
- [ ] Run full test suite to verify compatibility

### Phase 2: Deprecation Fixes
- [ ] Migrate to ESLint 9 with flat config
- [ ] Replace moment.js with date-fns
  - [ ] Find all moment imports
  - [ ] Refactor to date-fns
  - [ ] Test date formatting/parsing
- [ ] Review and optimize Lodash usage

### Phase 3: Bloat Reduction
- [ ] Analyze actual axios usage (remove if unused)
- [ ] Analyze actual lodash usage (remove if unused)
- [ ] Configure Jest to use ts-jest instead of Babel
- [ ] Remove unused dependencies
- [ ] Run `npm dedupe` to reduce duplication

### Phase 4: Automation
- [ ] Set up Dependabot or Renovate
- [ ] Configure security scanning (Snyk/GitHub Security)
- [ ] Add pre-commit hooks for npm audit
- [ ] Document dependency update process

---

## 9. Cost-Benefit Analysis

### If All Recommendations Implemented:

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Security Vulnerabilities** | 5 (1 high) | 0 | ✅ 100% |
| **Outdated Packages** | 8 major | 0 | ✅ 100% |
| **Deprecated Packages** | 3 | 0 | ✅ 100% |
| **node_modules Size** | 118MB | ~85MB | ✅ 28% reduction |
| **Total Packages** | 460 | ~320 | ✅ 30% reduction |
| **Maintenance Risk** | High | Low | ✅ Significant |

### Estimated Time Investment:
- Phase 1 (Security): 2-4 hours
- Phase 2 (Deprecations): 8-16 hours
- Phase 3 (Bloat): 4-8 hours
- Phase 4 (Automation): 2-4 hours

**Total:** 16-32 hours of development time

### Return on Investment:
- **Immediate:** Eliminate security vulnerabilities
- **Short-term:** Better NetSuite API support, faster builds
- **Long-term:** Easier maintenance, automated updates, reduced tech debt

---

## 10. Additional Recommendations

### Consider Adding

#### 1. Package Lock Security
```bash
# Use package-lock.json and commit it
npm install --package-lock
git add package-lock.json
```

#### 2. Security Scanning in CI/CD
```yaml
# .github/workflows/security.yml
name: Security Audit
on: [push, pull_request]
jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
```

#### 3. Dependency Update Policy
- Security updates: Immediate
- Major versions: Monthly review
- Minor/patch: Automated with Dependabot

#### 4. NetSuite-Specific Best Practices
- Only include dependencies that run in NetSuite environment
- Keep production dependencies minimal
- Most utilities should be devDependencies
- Use NetSuite's native modules when possible

---

## Summary

This NetSuite project has significant dependency issues that should be addressed:

### Critical Issues:
1. 🔴 **High-severity security vulnerability in axios** (CSRF/SSRF)
2. 🔴 **NetSuite types 3 years out of date**
3. 🔴 **ESLint 8 no longer supported**

### Important Issues:
4. 🟠 Using deprecated moment.js (4.4MB bloat)
5. 🟠 TypeScript 2 major versions behind
6. 🟠 Potentially unnecessary production dependencies

### Recommendations Priority:
1. **Week 1:** Fix security issues and update critical packages
2. **Month 1:** Migrate from deprecated packages
3. **Quarter 1:** Optimize bundle size and automate dependency management

**Next Steps:** Start with Phase 1 of the migration checklist above.

---

**Report Generated:** 2026-01-17
**Audit Tool:** npm audit, npm outdated
**Reviewed By:** Claude Code Dependency Auditor
