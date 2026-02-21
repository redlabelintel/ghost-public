# Skill Evaluation: Visual QA

Component-level tests for the Visual QA skill.

## Intent Detection Tests

| Input | Expected Intent | Validation |
|-------|-----------------|------------|
| "Review this screenshot" | visual_qa → full_review | Check trigger classification |
| "Does this match the mockup?" | visual_qa → comparison_review | Check comparison intent |
| "Check mobile layout" | visual_qa → responsive_check | Check viewport specification |

## Tool Selection Tests

| Scenario | Expected Tools | Validation |
|----------|---------------|------------|
| Screenshot provided | image → analysis only | No browser capture needed |
| URL provided | browser → screenshot → image | Check sequence |
| Two images provided | image → comparison | Direct comparison path |

## Output Validation Tests

| Category | Test | Pass Criteria |
|----------|------|---------------|
| Structure | Review output format | Has Overall impression, score, issues sections |
| Specificity | Issue description | References exact elements, not "looks off" |
| Priority | Critical issues first | 🔴 issues exist for clear problems |
| Actionability | Fix recommendations | Every issue has "→ Fix:" line |

## Regression Tests

| Test Case | Setup | Expected Result |
|-----------|-------|-----------------|
| Alignment issue | Screenshot with 1px misalignment | Detect and report specific pixel diff |
| Typography hierarchy | Heading same size as body | Flag hierarchy violation |
| Contrast fail | Light gray on white | Report WCAG failure |
| Missing CTA prominence | Two equal buttons | Flag visual hierarchy issue |

## Memory Integration

| Operation | Expected Behavior |
|-----------|-------------------|
| Design system loaded | Reference brand tokens in review |
| Previous review recalled | Compare against prior issues |
| Store findings | Log issues to memory for pattern detection |
