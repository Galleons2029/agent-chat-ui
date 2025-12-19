export const rawData = [
  { ccy: 'DUS', dt: '20250601', gnl_ldgr_bal: '-32682.62', org_num: '001170661', sbact_acct_bal: '-79549.62', sbj_num: '01018114', tot_mint_dif: '-46867' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-376583.32', org_num: '010770666', sbact_acct_bal: '-407084.21', sbj_num: '01018114', tot_mint_dif: '-30500.89' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '1461.3', org_num: '018070666', sbact_acct_bal: '0', sbj_num: '01018114', tot_mint_dif: '-1461.3' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-876623.8', org_num: '020070666', sbact_acct_bal: '-706815.29', sbj_num: '01018114', tot_mint_dif: '169808.51' },
  { ccy: 'YJP', dt: '20250602', gnl_ldgr_bal: '-34679880', org_num: '020070666', sbact_acct_bal: '-39274837', sbj_num: '01018114', tot_mint_dif: '-4594957' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-48070', org_num: '080070666', sbact_acct_bal: '0', sbj_num: '01018112', tot_mint_dif: '48070' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '376819.82', org_num: '080070666', sbact_acct_bal: '0', sbj_num: '01018114', tot_mint_dif: '-376819.82' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-150323.05', org_num: '100132058', sbact_acct_bal: '-198393.05', sbj_num: '01018112', tot_mint_dif: '-48070' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-2577286.56', org_num: '100132060', sbact_acct_bal: '-2579783.07', sbj_num: '01018114', tot_mint_dif: '-2496.51' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-10660', org_num: '100132070', sbact_acct_bal: '-20600', sbj_num: '01018114', tot_mint_dif: '-9940' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-44445', org_num: '100132110', sbact_acct_bal: '-48889.5', sbj_num: '01018114', tot_mint_dif: '-4444.5' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-692485.86', org_num: '200132058', sbact_acct_bal: '-698318.46', sbj_num: '01018114', tot_mint_dif: '-5832.6' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '5092.16', org_num: '300132058', sbact_acct_bal: '-3261.68', sbj_num: '01018114', tot_mint_dif: '-8353.84' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '2828.52', org_num: '500132058', sbact_acct_bal: '-5811.48', sbj_num: '01018114', tot_mint_dif: '-8640' },
  { ccy: 'DUS', dt: '20250602', gnl_ldgr_bal: '-12771.35', org_num: '610070666', sbact_acct_bal: '-21537.66', sbj_num: '01018114', tot_mint_dif: '-8766.31' },
  { ccy: 'DUS', dt: '20250601', gnl_ldgr_bal: '-192735.86', org_num: '001570661', sbact_acct_bal: '-252545.06', sbj_num: '01018114', tot_mint_dif: '-59809.2' },
  { ccy: 'DUS', dt: '20250601', gnl_ldgr_bal: '-245549.98', org_num: '001570661', sbact_acct_bal: '-313647.18', sbj_num: '01018114', tot_mint_dif: ' -68097.2' },
  { ccy: 'DUS', dt: '20250601', gnl_ldgr_bal: '-567794.03', org_num: '100132058', sbact_acct_bal: '-806062.57', sbj_num: '01018114', tot_mint_dif: '-238268.54' },
  { ccy: 'DUS', dt: '20250609', gnl_ldgr_bal: '-567683.42', org_num: '100132058', sbact_acct_bal: '-811098.62', sbj_num: '01018114', tot_mint_dif: '-243415.2' },
  { ccy: 'YCN', dt: '20250606', gnl_ldgr_bal: '-446811.08', org_num: '100132040', sbact_acct_bal: '-446910.85', sbj_num: '01178107', tot_mint_dif: '-99.77' },
  { ccy: 'YCN', dt: '20250601', gnl_ldgr_bal: '-243831.09', org_num: '220070667', sbact_acct_bal: '-242814.84', sbj_num: '01228107', tot_mint_dif: '1016.25' },
] as const;
const normalizeSuggestionText = (text: string): string[] =>
  text
    .trim()
    .split('\n')
    .map((line) => line.replace(/\r/g, '').trimEnd());
const rawSuggestionTextMap: Record<string, string> = {
 
};

export const suggestionMap: Record<string, string[]> = Object.fromEntries(
  Object.entries(rawSuggestionTextMap).map(([key, text]) => [key, normalizeSuggestionText(text)]),
);

export const buildFallbackSteps = (org: string, subjectNo: string, ccy: string, dt: string): string[] => [
  '【处理建议暂缺】',
  `机构: ${org}, 科目: ${subjectNo}, 币种: ${ccy}, 日期: ${dt}`,
  '暂无匹配的处理建议，请补充分析。',
];


const sanitizeMermaidText = (text: string): string =>
  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(/[\[\]]/g, '')
        .replace(/`/g, "'")
        .replace(/\|/g, '‖')
        .replace(/\\/g, '/')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
    .join('\n');


const typeFlows: Record<
  string,
  {
    title: string;
    summary: string;
    steps: string[];
  }
> = {
  'Type 1': {
    title: 'Type1 恒定差额',
    summary: '总账与分户差额恒定，找首个不平日比对借贷发生额',
    steps: [
      '锁定首个不平日\n回溯总分首次偏离',
      '计算首日分户余额差\n对照当日借/贷发生额',
      '若匹配 -> 锁定凭证\n不匹配 -> 继续排查业务变动',
    ],
  },
  'Type 2': {
    title: 'Type2 多次不平',
    summary: '6月1日起差额波动，需定位多次不平第一次并按 Type1 处理',
    steps: [
      '梳理历史差额轨迹\n识别所有不平节点',
      '定位最早不平事件\n套用 Type1 计算',
      '逐个复现后续不平\n确认是否叠加新错误',
    ],
  },
  'Type 3': {
    title: 'Type3 区间不平',
    summary: '部分天平衡、部分不平，整体流程借鉴 Type1',
    steps: [
      '界定异常区间\n找到首个不平日',
      '比较平衡日与不平日余额差\n验证差额特征',
      '沿用 Type1 思路\n形成调整方案',
    ],
  },
  default: {
    title: '通用差异处理',
    summary: '按 Type1 思路定位不平首日并比对借贷发生额',
    steps: [
      '定位不平首日',
      '比对余额差与当日借贷发生额',
      '输出初步处理建议',
    ],
  },
};

const buildMermaidChartFromSuggestion = (entry: string): string => {
  const regex = /机构: (\d+), 科目: (\d+), 币种: (\w+), 日期: (\d{8})/;
  const match = entry.match(regex);
  const institution = match ? match[1] : 'Unknown';
  const subject = match ? match[2] : 'Unknown';
  const currency = match ? match[3] : 'Unknown';
  const date = match ? match[4] : 'Unknown';
  const errorType = entry.includes('TYPE1') ? 'Type 1' : entry.includes('TYPE2') ? 'Type 2' : 'Type 3';
  const discrepancy = entry.includes('差额变化') ? '差额不固定，需关注波动' : '差额恒定或阶段性恒定';
  const detailSnippet =
    sanitizeMermaidText(
      entry
        .replace(/\?/g, ' ')
        .replace(/[\[\]]/g, '')
        .slice(0, 300),
    ) || 'Details unavailable';
  const metaBlock = sanitizeMermaidText([`机构: ${institution}`, `科目: ${subject}`, `币种: ${currency}`, `日期: ${date}`].join(''));
  const discrepancyLabel = sanitizeMermaidText(discrepancy);
  const flow = typeFlows[errorType] ?? typeFlows.default;
  const summaryLabel = sanitizeMermaidText(`${flow.title}\n${flow.summary}`);

  const lines = [
    'flowchart TD',
    '  classDef stage fill:#ecfdf5,stroke:#34d399,stroke-width:1px',
    '  classDef detail fill:#eef2ff,stroke:#6366f1,stroke-width:1px',
    '  start([差异触发]):::stage',
    `  meta["${metaBlock}"]:::stage`,
    `  typeIntro["${summaryLabel}"]:::stage`,
    `  analysis["差异特征\n${discrepancyLabel}"]:::stage`,
    '  start --> meta',
    '  meta --> typeIntro',
    '  typeIntro --> analysis',
  ];

  let previousNode = 'analysis';
  const typeSteps = flow.steps.length ? flow.steps : typeFlows.default.steps;
  typeSteps.forEach((step, idx) => {
    const nodeId = `typeStep${idx}`;
    const label = sanitizeMermaidText(step);
    lines.push(`  ${nodeId}["${label}"]:::stage`);
    lines.push(`  ${previousNode} --> ${nodeId}`);
    previousNode = nodeId;
  });

  const reversalLabel = sanitizeMermaidText('冲销排查\n是否存在红蓝字或冲销凭证');
  lines.push(`  reversal["${reversalLabel}"]:::stage`);
  lines.push(`  ${previousNode} --> reversal`);
  previousNode = 'reversal';

  const historyCompareLabel = sanitizeMermaidText('步骤6：金融历史 vs 传票历史\n对比当日借/贷发生额');
  lines.push(`  history6["${historyCompareLabel}"]:::detail`);
  lines.push(`  ${previousNode} --> history6`);
  previousNode = 'history6';

  const mismatchLabel = sanitizeMermaidText('步骤7：若不一致\n逐笔比对交易明细锁定差错');
  lines.push(`  history7["${mismatchLabel}"]:::detail`);
  lines.push('  history6 --> history7');
  previousNode = 'history7';
  const detailLabel = sanitizeMermaidText(`建议摘要\n${detailSnippet}...`);
  lines.push(`  detailNote["${detailLabel}"]:::detail`);
  lines.push(`  ${previousNode} --> detailNote`);
  lines.push('  close([输出结论并登记处理]):::stage');
  lines.push('  detailNote --> close');
  return lines.join('\n');
};

const mermaidChartBySuggestion: Record<string, string> = Object.fromEntries(
  Object.entries(rawSuggestionTextMap).map(([key, text]) => [key, buildMermaidChartFromSuggestion(text)]),
);

export const mermaidData: Record<string, string> = {
  ...mermaidChartBySuggestion,
  default: `flowchart TD
    classDef stage fill:#ecfdf5,stroke:#34d399,stroke-width:1px
    classDef detail fill:#eef2ff,stroke:#6366f1,stroke-width:1px
    start([差异触发]):::stage
    locate[定位机构/科目/币种]:::stage
    typeIntro[研判类型并回溯首个不平日]:::stage
    analysis[比对首日余额差与当日借/贷发生额]:::stage
    reversal[冲销排查]:::stage
    history6[步骤6：金融历史 vs 传票历史对比]:::detail
    history7[步骤7：逐笔比对交易明细锁定差错]:::detail
    detailNote[记录摘要]:::detail
    close([输出结论并登记处理]):::stage
    start --> locate --> typeIntro --> analysis --> reversal --> history6 --> history7 --> detailNote --> close`,
};
