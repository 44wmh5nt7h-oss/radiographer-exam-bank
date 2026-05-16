# questions.json 資料格式

每一題建議使用以下格式：

```json
{
  "id": "112-1-放射物理-001",
  "year": 112,
  "exam_round": "第一次",
  "subject": "放射物理",
  "question_number": 1,
  "question": "題目文字",
  "options": {
    "A": "選項 A",
    "B": "選項 B",
    "C": "選項 C",
    "D": "選項 D"
  },
  "answer": "C",
  "explanation": "",
  "source": "考選部歷屆試題"
}
```

欄位說明：

- `id`：唯一識別值，建議由年份、次別、科目與題號組成
- `year`：民國年份
- `exam_round`：考試次別，例如第一次、第二次
- `subject`：科目名稱
- `question_number`：題號
- `question`：題目文字
- `options`：四個選項
- `answer`：正確答案，使用 `A`、`B`、`C`、`D`
- `explanation`：解析，若暫時沒有可填空字串
- `source`：題目來源
