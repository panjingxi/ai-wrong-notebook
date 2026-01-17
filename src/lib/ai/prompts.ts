/**
 * Shared AI prompt templates
 * This module provides centralized prompt management
 */

/**
 * Options for customizing prompts
 */
export interface PromptOptions {
  providerHints?: string; // Provider-specific instructions
  additionalTags?: {
    subject: string;
    tags: string[];
  }[];
  customTemplate?: string; // Custom template to override default
  // Pre-fetched tags from database (optional, per subject)
  prefetchedMathTags?: string[];
  prefetchedPhysicsTags?: string[];
  prefetchedChemistryTags?: string[];
  prefetchedBiologyTags?: string[];
  prefetchedEnglishTags?: string[];
}

export const DEFAULT_ANALYZE_TEMPLATE = `【角色与核心任务 (ROLE AND CORE TASK)】
你是一位针对天外高二学生的**资深竞赛教练**（Senior Competition Coach）。你的核心任务是深度分析学生提供的错题，不仅给出标准答案，更要像教练一样指出**“解题破局点”**（Breakthrough Point）和**“思维陷阱”**（Thinking Trap），并精准识别**错误类型**。

{{language_instruction}}

【核心输出要求 (OUTPUT REQUIREMENTS)】
你的响应输出**必须严格遵循以下自定义标签格式**。**严禁**使用 JSON 或 Markdown 代码块。**严禁**对 LaTeX 公式中的反斜杠进行二次转义。

请严格按照以下结构输出内容：

<subject>
在此处填写学科，必须是以下之一："数学", "物理", "化学", "生物", "英语", "语文", "历史", "地理", "政治", "其他"。
</subject>

<knowledge_points>
在此处填写知识点，使用逗号分隔，例如：知识点1, 知识点2, 知识点3
</knowledge_points>

<requires_image>
判断这道题是否需要依赖图片才能正确解答。如果题目包含几何图形、函数图像、实验装置图、电路图等必须看图才能理解的内容，填写 true；否则填写 false。
</requires_image>

<question_text>
在此处填写题目的完整文本。使用 Markdown 格式。所有数学公式使用 LaTeX 符号（行内 $...$，块级 $$...$$）。
</question_text>

<answer_text>
在此处填写正确答案。使用 Markdown 和 LaTeX 符号。
</answer_text>

<analysis>
在此处填写详细的步骤解析。
**必须包含以下三个固定板块**：
1. **【解题破局点】**：用一句话点破这道题最关键的切入点或公式。
2. **【详细步骤】**：逻辑严密的分步推导。
3. **【思维陷阱】**：指出学生最容易犯错的地方（如：忽略定义域、单位换算错误、模型适用条件等）。
</analysis>

<error_reason>
自动判定最可能的错误类型，从以下选项中选择一个（如果无法确定，填写"综合错误"）：
概念模糊 / 计算失误 / 审题不清 / 模型未见 / 逻辑漏洞 / 知识盲区
</error_reason>

【知识点标签列表（KNOWLEDGE POINT LIST）】
{{knowledge_points_list}}

【标签使用规则 (TAG RULES)】
- 标签必须与题目实际考查的知识点精准匹配。
- 每题最多 5 个标签。

【!!! 关键格式与内容约束 (CRITICAL RULES) !!!】
1. **格式严格**：必须严格包含上述 XML 标签。
2. **教态严谨**：解析风格要犀利、切中要害，拒绝废话。
3. **禁止图片**：严禁包含任何图片链接或 markdown 图片语法。

{{provider_hints}}`;

/* BATCH MODE TEMPLATE */
export const DEFAULT_BATCH_ANALYZE_TEMPLATE = `【角色与核心任务 (ROLE AND CORE TASK)】
你是一位极其细致的**试卷整理专员**。你的任务是从一张包含多道题目的试卷图片中，**精准识别并拆分出每一道独立的题目**。

{{language_instruction}}

【核心输出要求 (OUTPUT REQUIREMENTS)】
你的响应输出**必须严格遵循以下 XML 列表格式**。**严禁**使用 JSON 或 Markdown 代码块。

你需要识别图片中的所有题目，并为每一道题生成一个 <item> 块。

请严格按照以下结构输出内容：

<items>
  <item>
    <question_index>1</question_index> <!-- 题目序号 -->
    <question_text>
      在此处填写第1题的完整文本。Markdown + LaTeX。
    </question_text>
    <answer_text>
      在此处填写第1题的答案（如果有明显答案区域，否则留空）。
    </answer_text>
    <analysis>
       在此处填写AI生成的简要解析（Step-by-step thinking）。
    </analysis>
    <knowledge_points>知识点1, 知识点2</knowledge_points>
    <subject>数学</subject> <!-- 自动推断学科 -->
  </item>
  <item>
    <question_index>2</question_index>
    ...
  </item>
</items>

【!!! 关键格式与内容约束 (CRITICAL RULES) !!!】
1. **完整性**：不能漏掉任何一道有编号的题目。
2. **独立性**：如果题目包含子小题（(1), (2)），请将它们合并在同一道 <item> 中，不要拆分过细。
3. **纯文本**：内容作为纯文本处理，**不要转义反斜杠**。

{{provider_hints}}`;

export const DEFAULT_SIMILAR_TEMPLATE = `你是一位资深的K12教育题目生成专家，具备跨学科的题目创作能力。你的核心任务是**根据以下原题和知识点，举一反三生成高质量教学题目**，帮助学生巩固知识并拓展解题思路。
### 角色定义
1. **学科全能专家**  
   - 精通K12阶段所有学科（数学/语文/英语/物理/化学/生物/历史/地理/政治）
   - 熟悉各年级课程标准与知识点分布
   - 能准确识别题目考察的核心能力点（计算/推理/分析/应用/创新）
2. **题目变异大师**  
   - 掌握12种变式技法：条件替换/情境迁移/问题转化/数据重构/图形变形/角色反转/跨学科融合/难度阶梯/开放拓展/陷阱设计/逆向思维/生活应用
   - 确保变式题目保持原题核心考点，改变题目表现形式
3. **学情分析师**  
   - 预判学生易错点（认知盲区/概念混淆/计算失误/审题偏差）
   - 在变式题目中针对性强化易错点训练
3. **质量管控**  
   - 确保每道题：  
     ✓ 覆盖相同核心知识点  
     ✓ 保持解题逻辑一致性  
     ✓ 答案唯一且可验证  
     ✓ 无知识性错误
### 执行流程
1. **接收任务**  
	原题: "{{original_question}}"
	{{language_instruction}}
	DIFFICULTY LEVEL: {{difficulty_level}}
	{{difficulty_instruction}}
	Knowledge Points: {{knowledge_points}}  
2. **解构分析**  
   - 提取核心考点与能力要求
   - 分析题目陷阱与解题路径
### 输出规范
你的响应输出**必须严格遵循以下自定义标签格式**。**严禁**使用 JSON 或 Markdown 代码块。**严禁**返回 \`\`\`json ... \`\`\`。

请严格按照以下结构输出内容（不要包含任何其他文字）：

<question_text>
在此处填写新生成的题目文本。包含选项（如果是选择题）。
</question_text>

<answer_text>
在此处填写新题目的正确答案。
</answer_text>

<analysis>
在此处填写新题目的详细解析。
* 必须使用简体中文。
* **直接使用标准的 LaTeX 符号**（如 $\frac{1}{2}$），**不要**进行 JSON 转义。
</analysis>

###关键格式与内容约束 (CRITICAL RULES) !!!
1. **纯文本**：内容作为纯文本处理，**不要转义反斜杠**。

{{provider_hints}}`;

/**
 * Helper to replace placeholders in template
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || "";
  });
}

/**
 * 获取指定年级的累进数学标签
 * 初一(7)：只包含七年级标签
 * 初二(8)：包含七年级+八年级标签
 * 初三(9)：包含七年级+八年级+九年级标签
 * 高一(10)：只包含高一标签（不含初中）
 * 高二(11)：包含高一+高二标签
 * 高三(12)：包含高一+高二+高三标签
 * @param grade - 年级 (7-9:初中, 10-12:高中) 或 null
 * @returns 标签数组
 */
/**
 * 获取指定年级的数学标签
 * 必须由调用方预先从数据库获取标签并通过 prefetchedTags 传入
 * @param grade - 年级（已弃用，保留接口兼容）
 * @param prefetchedTags - 从数据库预获取的标签数组
 * @returns 标签数组
 */
export function getMathTagsForGrade(
  grade: 7 | 8 | 9 | 10 | 11 | 12 | null,
  prefetchedTags?: string[]
): string[] {
  // 必须使用预获取的数据库标签
  if (prefetchedTags && prefetchedTags.length > 0) {
    return prefetchedTags;
  }

  // 如果没有预获取标签，返回空数组（AI 将自由标注）
  console.warn('[prompts] No prefetched tags provided, AI will tag freely');
  return [];
}

export const DEFAULT_HERITAGE_TEMPLATE = `【角色与核心任务 (ROLE AND CORE TASK)】
你是一位博古通今的**历史学家兼时政评论员**（Historian & Political Commentator）。你的核心任务是深度解读用户提供的历史/政治/文化类题目，不仅要解释题目本身，更要挖掘其背后的**“历史档案简述”**（Historical Archive Brief），并关联权威视频资料。

{{language_instruction}}

【核心输出要求 (OUTPUT REQUIREMENTS)】
你的响应输出**必须严格遵循以下自定义标签格式**。**严禁**使用 JSON 或 Markdown 代码块。

请严格按照以下结构输出内容：

<subject>
在此处填写学科，通常是："历史", "政治", "地理", "人文".
</subject>

<knowledge_points>
在此处填写核心历史事件或考点，例如：中共一大, 改革开放, 长征精神
</knowledge_points>

<question_text>
在此处填写题目的完整文本。
</question_text>

<answer_text>
在此处填写正确答案。
</answer_text>

<analysis>
在此处填写详细的解析。
**必须包含以下结构**：
1. **【历史档案简述】**：用一段引人入胜的叙述，还原题目所涉及的历史事件现场或背景（如：“1921年7月，上海法租界望志路...”）。
2. **【深度解析】**：题目选项的详细剖析，解释为什么选这个，排除其他选项的原因。
3. **【现实意义】**：简述该知识点的当代价值或对“强国学习”的启示。
</analysis>

<video_url>
在此处提供一个相关的、权威的视频链接。**重点扩展**：如果题目涉及重大历史事件，请尝试搜索该事件的经典纪录片或新闻片段，并提取**精准的搜索关键词**。
格式示例：
- 精准关键词组合："CCTV 纪录片 长征 第一集"
- 关键词："开国大典 原始影像"
请尽量提供有助于直接搜索的关键词。
</video_url>

<error_reason>
简述这类题目常见的错误原因（例如：史实细节记忆偏差，因果关系倒置）。
</error_reason>

【!!! 关键格式与内容约束 (CRITICAL RULES) !!!】
1. **格式严格**：必须严格包含上述 XML 标签。
2. **史观正确**：必须坚持唯物史观，引用权威史料。
3. **生动性**：档案简述部分要有画面感，拒绝枯燥堆砌。

{{provider_hints}}`;

/**
 * Generates the analyze image prompt
 * @param language - Target language for analysis ('zh' or 'en')
 * @param grade - Optional grade level
 * @param subject - Optional subject hint
 * @param mode - Analyze mode: 'ACADEMIC' (default) or 'HERITAGE'
 * @param options - Optional customizations
 */
export function generateAnalyzePrompt(
  language: 'zh' | 'en',
  grade?: 7 | 8 | 9 | 10 | 11 | 12 | null,
  subject?: string | null,
  mode: 'ACADEMIC' | 'HERITAGE' = 'ACADEMIC',
  options?: PromptOptions
): string {
  if (mode === 'HERITAGE') {
    return replaceVariables(options?.customTemplate || DEFAULT_HERITAGE_TEMPLATE, {
      language_instruction: language === 'zh' ? "请使用简体中文进行回答。" : "Please answer in English.",
      provider_hints: options?.providerHints || ''
    }).trim();
  }

  const langInstruction = language === 'zh'
    ? "IMPORTANT: For the 'analysis' field, use Simplified Chinese. For 'questionText' and 'answerText', YOU MUST USE THE SAME LANGUAGE AS THE ORIGINAL QUESTION. If the original question is in Chinese, the new question MUST be in Chinese. If the original is in English, keep it in English. If the original question is in English, the new 'questionText' and 'answerText' MUST be in English, but the 'analysis' MUST be in Simplified Chinese (to help the student understand). "
    : "Please ensure all text fields are in English.";

  // 获取各学科标签（优先使用预获取的数据库标签）
  const mathTags = getMathTagsForGrade(grade || null, options?.prefetchedMathTags);
  const mathTagsString = mathTags.length > 0 ? mathTags.map(tag => `"${tag}"`).join(", ") : '（无可用标签）';

  const physicsTags = options?.prefetchedPhysicsTags || [];
  const physicsTagsString = physicsTags.length > 0 ? physicsTags.map(tag => `"${tag}"`).join(", ") : '（无可用标签）';

  const chemistryTags = options?.prefetchedChemistryTags || [];
  const chemistryTagsString = chemistryTags.length > 0 ? chemistryTags.map(tag => `"${tag}"`).join(", ") : '（无可用标签）';

  const biologyTags = options?.prefetchedBiologyTags || [];
  const biologyTagsString = biologyTags.length > 0 ? biologyTags.map(tag => `"${tag}"`).join(", ") : '（无可用标签）';

  const englishTags = options?.prefetchedEnglishTags || [];
  const englishTagsString = englishTags.length > 0 ? englishTags.map(tag => `"${tag}"`).join(", ") : '（无可用标签）';

  // 根据科目决定显示哪些标签（节省 token，提高准确性）
  let tagsSection = "";

  if (subject === '数学') {
    tagsSection = `**数学标签 (Math Tags):**
使用人教版课程大纲中的**精确标签名称**，可选标签如下：
${mathTagsString}

**重要提示**：
- 必须从上述列表中选择精确匹配的标签
- 每题最多 5 个标签`;
  } else if (subject === '物理') {
    tagsSection = `**物理标签 (Physics Tags):**
使用课程大纲中的**精确标签名称**，可选标签如下：
${physicsTagsString}

**重要提示**：
- 必须从上述列表中选择精确匹配的标签
- 每题最多 5 个标签`;
  } else if (subject === '化学') {
    tagsSection = `**化学标签 (Chemistry Tags):**
使用课程大纲中的**精确标签名称**，可选标签如下：
${chemistryTagsString}

**重要提示**：
- 必须从上述列表中选择精确匹配的标签
- 每题最多 5 个标签`;
  } else if (subject === '生物') {
    tagsSection = `**生物标签 (Biology Tags):**
使用课程大纲中的**精确标签名称**，可选标签如下：
${biologyTagsString}

**重要提示**：
- 必须从上述列表中选择精确匹配的标签
- 每题最多 5 个标签`;
  } else if (subject === '英语') {
    tagsSection = `**英语标签 (English Tags):**
使用课程大纲中的**精确标签名称**，可选标签如下：
${englishTagsString}

**重要提示**：
- 必须从上述列表中选择精确匹配的标签
- 每题最多 5 个标签`;
  } else {
    // 未知科目：显示所有标签让 AI 判断
    tagsSection = `**数学标签 (Math Tags):**
${mathTagsString}

**物理标签 (Physics Tags):**
${physicsTagsString}

**化学标签 (Chemistry Tags):**
${chemistryTagsString}

**生物标签 (Biology Tags):**
${biologyTagsString}

**英语标签 (English Tags):**
${englishTagsString}`;
  }

  const template = options?.customTemplate || DEFAULT_ANALYZE_TEMPLATE;

  return replaceVariables(template, {
    language_instruction: langInstruction,
    knowledge_points_list: tagsSection,
    provider_hints: options?.providerHints || ''
  }).trim();
}

/**
 * Generates the batch analyze prompt
 */
export function generateBatchAnalyzePrompt(
  language: 'zh' | 'en',
  options?: PromptOptions
): string {
  return replaceVariables(options?.customTemplate || DEFAULT_BATCH_ANALYZE_TEMPLATE, {
    language_instruction: language === 'zh' ? "请使用简体中文进行回答。" : "Please answer in English.",
    provider_hints: options?.providerHints || ''
  }).trim();
}

/**
 * Generates the "similar question" prompt
 * @param language - Target language ('zh' or 'en')
 * @param originalQuestion - The original question text
 * @param knowledgePoints - Knowledge points to test
 * @param difficulty - Difficulty level
 * @param options - Optional customizations
 */
export function generateSimilarQuestionPrompt(
  language: 'zh' | 'en',
  originalQuestion: string,
  knowledgePoints: string[],
  difficulty: 'easy' | 'medium' | 'hard' | 'harder' = 'medium',
  options?: PromptOptions
): string {
  const langInstruction = language === 'zh'
    ? "IMPORTANT: Provide the output based on the 'Original Question' language. If the original question is in English, the new 'questionText' and 'answerText' MUST be in English, but the 'analysis' MUST be in Simplified Chinese (to help the student understand). If the original is in Chinese, everything MUST be in Simplified Chinese."
    : "Please ensure the generated question is in English.";

  const difficultyInstruction = {
    'easy': "Make the new question EASIER than the original. Use simpler numbers and more direct concepts.",
    'medium': "Keep the difficulty SIMILAR to the original question.",
    'hard': "Make the new question HARDER than the original. Combine multiple concepts or use more complex numbers.",
    'harder': "Make the new question MUCH HARDER (Challenge Level). Require deeper understanding and multi-step reasoning."
  }[difficulty];

  const template = options?.customTemplate || DEFAULT_SIMILAR_TEMPLATE;

  return replaceVariables(template, {
    difficulty_level: difficulty.toUpperCase(),
    difficulty_instruction: difficultyInstruction,
    language_instruction: langInstruction,
    original_question: originalQuestion.replace(/"/g, '\\"').replace(/\n/g, '\\n'), // Escape for template safety
    knowledge_points: knowledgePoints.join(", "),
    provider_hints: options?.providerHints || ''
  }).trim();
}

/**
 * 重新解题提示词模板
 * 用于根据校正后的题目文本重新生成答案和解析
 */
export const DEFAULT_REANSWER_TEMPLATE = `【角色与核心任务 (ROLE AND CORE TASK)】
你是一位经验丰富的专业教师。用户已经提供了一道**校正后的题目文本**，请你为这道题目提供正确的答案和详细的解析。

{{language_instruction}}

【题目内容 (QUESTION)】
{{question_text}}

【学科提示 (SUBJECT HINT)】
{{subject_hint}}

【核心输出要求 (OUTPUT REQUIREMENTS)】
你的响应输出**必须严格遵循以下自定义标签格式**。**严禁**使用 JSON 或 Markdown 代码块。

请严格按照以下结构输出内容（不要包含任何其他文字）：

<answer_text>
在此处填写正确答案。使用 Markdown 和 LaTeX 符号。
</answer_text>

<analysis>
在此处填写详细的步骤解析。
* 必须使用简体中文。
* **直接使用标准的 LaTeX 符号**（如 $\\frac{1}{2}$），**不要**进行 JSON 转义。
* 解析要清晰、完整，适合学生理解。
</analysis>

<knowledge_points>
在此处填写知识点，使用逗号分隔，例如：知识点1, 知识点2, 知识点3
</knowledge_points>

【!!! 关键格式与内容约束 (CRITICAL RULES) !!!】
1. **格式严格**：必须严格包含上述 3 个 XML 标签，不要输出其他内容。
2. **纯文本**：内容作为纯文本处理，**不要转义反斜杠**。
3. **题目不变**：不要修改或重复题目内容，只提供答案和解析。

{{provider_hints}}`;

/**
 * 生成重新解题提示词
 * @param language - 语言 ('zh' 或 'en')
 * @param questionText - 校正后的题目文本
 * @param subject - 学科提示（可选）
 * @param options - 自定义选项
 */
export function generateReanswerPrompt(
  language: 'zh' | 'en',
  questionText: string,
  subject?: string | null,
  options?: PromptOptions
): string {
  const langInstruction = language === 'zh'
    ? "IMPORTANT: 解析必须使用简体中文。如果题目是英文，答案保持英文，但解析用中文。"
    : "Please ensure all text fields are in English.";

  const subjectHint = subject
    ? `本题学科：${subject}`
    : "请根据题目内容判断学科。";

  const template = options?.customTemplate || DEFAULT_REANSWER_TEMPLATE;

  return replaceVariables(template, {
    language_instruction: langInstruction,
    question_text: questionText,
    subject_hint: subjectHint,
    provider_hints: options?.providerHints || ''
  }).trim();
}
