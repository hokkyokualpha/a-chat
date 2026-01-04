# A-Chat コントリビューションガイド

A-Chatへのコントリビューションに興味を持っていただきありがとうございます！このドキュメントでは、プロジェクトへの貢献方法を説明します。

## 目次

- [行動規範](#行動規範)
- [始め方](#始め方)
- [開発プロセス](#開発プロセス)
- [プルリクエストのガイドライン](#プルリクエストのガイドライン)
- [コーディング規約](#コーディング規約)
- [テスト規約](#テスト規約)
- [コミットメッセージ規約](#コミットメッセージ規約)
- [Issue の作成](#issue-の作成)
- [質問とサポート](#質問とサポート)

---

## 行動規範

### 私たちの約束

このプロジェクトのメンバー、コントリビューター、リーダーは、年齢、体型、障害の有無、民族性、性的特徴、性自認と表現、経験レベル、教育、社会経済的地位、国籍、外見、人種、宗教、性的同一性と指向に関わらず、すべての人にとってハラスメントのない環境を提供することを約束します。

### 期待される行動

- 歓迎的で包括的な言葉遣いを使用する
- 異なる視点や経験を尊重する
- 建設的な批判を受け入れる
- コミュニティにとって最善のことに焦点を当てる
- 他のコミュニティメンバーに共感を示す

### 許容されない行動

- 性的な言葉や画像の使用、および不適切な性的関心
- トローリング、侮辱的/軽蔑的なコメント、個人的または政治的攻撃
- 公的または私的なハラスメント
- 他者の個人情報（物理的または電子的アドレスなど）の明示的な許可なしでの公開
- 専門的な環境で不適切と合理的に見なされる可能性のあるその他の行為

---

## 始め方

### 1. リポジトリのフォーク

1. GitHub上で [a-chat リポジトリ](https://github.com/your-username/a-chat) にアクセス
2. 右上の "Fork" ボタンをクリック
3. フォークしたリポジトリをローカルにクローン

```bash
git clone https://github.com/your-username/a-chat.git
cd a-chat
```

### 2. 開発環境のセットアップ

詳細は [DEVELOPMENT.md](./DEVELOPMENT.md) を参照してください。

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集して必要な値を設定

# Prisma Client の生成
npx prisma generate

# 開発サーバーの起動
npm run dev
```

### 3. アップストリームリポジトリの追加

```bash
git remote add upstream https://github.com/original-owner/a-chat.git
git fetch upstream
```

---

## 開発プロセス

### ブランチ戦略

```
main                    # 安定版（本番環境）
  └── feature/xxx       # 新機能開発
  └── bugfix/xxx        # バグ修正
  └── hotfix/xxx        # 緊急修正
```

### 作業フロー

1. **Issue の作成または選択**
   - 新機能やバグ修正の前に Issue を作成
   - 既存の Issue から作業するものを選択

2. **ブランチの作成**

```bash
# main ブランチから最新を取得
git checkout main
git pull upstream main

# 新しいブランチを作成
git checkout -b feature/your-feature-name
```

3. **開発**
   - コードの変更
   - テストの追加・更新
   - ドキュメントの更新

4. **テストの実行**

```bash
# ユニットテスト
npm test

# カバレッジチェック
npm run test:coverage

# ビルドテスト
npm run build

# Lint チェック
npm run lint
```

5. **コミット**

```bash
git add .
git commit -m "feat: add new feature"
```

6. **プッシュ**

```bash
git push origin feature/your-feature-name
```

7. **プルリクエストの作成**
   - GitHub でプルリクエストを作成
   - テンプレートに従って記入
   - レビューを待つ

---

## プルリクエストのガイドライン

### PR を作成する前に

- [ ] すべてのテストが通ることを確認
- [ ] Lint エラーがないことを確認
- [ ] ビルドが成功することを確認
- [ ] コードがコーディング規約に従っていることを確認
- [ ] 関連するドキュメントを更新

### PR の説明に含める内容

```markdown
## 概要
このPRで何を変更したかを簡潔に説明

## 関連Issue
Closes #123

## 変更内容
- 変更点1
- 変更点2
- 変更点3

## テスト方法
1. ステップ1
2. ステップ2
3. 期待される結果

## スクリーンショット（該当する場合）
[画像を添付]

## チェックリスト
- [ ] テストを追加/更新した
- [ ] ドキュメントを更新した
- [ ] Lint エラーがない
- [ ] ビルドが成功する
- [ ] すべてのテストが通る
```

### レビュープロセス

1. **自動チェック**: CI/CD がテストとビルドを実行
2. **コードレビュー**: メンテナーが変更内容をレビュー
3. **フィードバック**: 必要に応じて修正を依頼
4. **承認**: 承認されたらマージ

### レビューコメントへの対応

- 建設的なフィードバックとして受け入れる
- 質問には丁寧に回答する
- 必要な変更を追加コミットで実施
- すべての指摘に対応したら、レビュアーに通知

---

## コーディング規約

### TypeScript

#### 型定義

```typescript
// Good: 明示的な型定義
interface User {
  id: string
  name: string
  email: string
}

function getUser(id: string): Promise<User> {
  // ...
}

// Bad: any の使用
function getUser(id: any): any {
  // ...
}
```

#### 型アサーション

```typescript
// Good: 型ガードを使用
function isString(value: unknown): value is string {
  return typeof value === "string"
}

// Bad: as を乱用
const value = getValue() as string
```

### React コンポーネント

#### 関数コンポーネント

```typescript
// Good: 関数宣言 + Props の型定義
interface MessageProps {
  content: string
  role: "user" | "assistant"
}

export default function Message({ content, role }: MessageProps) {
  return <div className={styles[role]}>{content}</div>
}

// Bad: アロー関数 + 型定義なし
const Message = (props) => {
  return <div>{props.content}</div>
}
```

#### Hooks の使用

```typescript
// Good: useCallback でメモ化
const handleClick = useCallback(() => {
  doSomething()
}, [dependencies])

// Good: useMemo で計算結果をキャッシュ
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b)
}, [a, b])
```

### CSS Modules

```css
/* Good: BEM命名規則 */
.message {
  padding: 12px;
}

.message--user {
  background-color: blue;
}

.message--assistant {
  background-color: gray;
}

/* Bad: ネストが深い */
.container .wrapper .message .content .text {
  color: red;
}
```

### ファイル構成

```typescript
// Good: import の順序
// 1. 外部ライブラリ
import { useState, useEffect } from "react"
import { z } from "zod"

// 2. 内部モジュール
import { createSession } from "@/lib/db"
import Message from "@/components/Message"

// 3. 型定義
import type { Session } from "@prisma/client"

// 4. スタイル
import styles from "./ChatContainer.module.css"
```

---

## テスト規約

### テストの原則

1. **AAA パターン**: Arrange（準備）, Act（実行）, Assert（検証）
2. **1テスト1アサーション**: 可能な限り単一の検証
3. **明確なテスト名**: 何をテストしているか分かりやすく

### テストの例

```typescript
describe("Message Component", () => {
  // Arrange
  const mockProps = {
    role: "user" as const,
    content: "Hello",
    timestamp: "2026-01-04T10:00:00.000Z",
  }

  it("renders user message with correct styling", () => {
    // Act
    render(<Message {...mockProps} />)

    // Assert
    const message = screen.getByText("Hello")
    expect(message).toBeInTheDocument()
    expect(message).toHaveClass("message--user")
  })

  it("displays timestamp in correct format", () => {
    render(<Message {...mockProps} />)

    expect(screen.getByText(/10:00/)).toBeInTheDocument()
  })
})
```

### テストカバレッジ

- **目標**: 80%以上のカバレッジ
- **必須**: 新しいコードには必ずテストを追加
- **重要**: エッジケースと異常系もテスト

```bash
# カバレッジレポート
npm run test:coverage

# カバレッジが低い場合はテストを追加
```

---

## コミットメッセージ規約

### フォーマット

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type（必須）

- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント変更
- `style`: コードフォーマット（機能変更なし）
- `refactor`: リファクタリング
- `test`: テスト追加・修正
- `chore`: ビルド・設定変更

### Scope（任意）

変更の範囲を示す：`api`, `ui`, `db`, `auth` など

### Subject（必須）

- 50文字以内
- 小文字で始める
- 命令形（"add" not "added"）
- 末尾にピリオドなし

### 例

```bash
# Good
git commit -m "feat(api): add streaming chat endpoint"
git commit -m "fix(ui): correct message alignment on mobile"
git commit -m "docs: update API documentation with examples"

# Bad
git commit -m "update"
git commit -m "fix bug"
git commit -m "Added new feature."
```

### 複数行のコミット

```bash
git commit -m "feat(api): add user authentication

- Implement JWT-based auth
- Add login and signup endpoints
- Create auth middleware

Closes #45"
```

---

## Issue の作成

### バグレポート

```markdown
**バグの概要**
明確かつ簡潔な説明

**再現手順**
1. '...' に移動
2. '...' をクリック
3. '...' までスクロール
4. エラーを確認

**期待される動作**
何が起こるべきかを説明

**実際の動作**
何が起こったかを説明

**スクリーンショット**
該当する場合は画像を添付

**環境**
- OS: [例: macOS 13.0]
- ブラウザ: [例: Chrome 110]
- Node.js バージョン: [例: 20.0.0]

**追加情報**
その他の文脈や情報
```

### 機能リクエスト

```markdown
**機能の概要**
追加したい機能の説明

**動機**
なぜこの機能が必要か

**提案する解決策**
どのように実装するか

**代替案**
他に検討した方法

**追加情報**
その他の文脈や情報
```

---

## 質問とサポート

### 質問する前に

1. [README.md](./README.md) を読む
2. [DEVELOPMENT.md](./DEVELOPMENT.md) を確認
3. [既存の Issues](https://github.com/your-username/a-chat/issues) を検索
4. [Discussions](https://github.com/your-username/a-chat/discussions) を確認

### 質問方法

- **GitHub Discussions**: 一般的な質問や議論
- **Issue**: バグや機能リクエスト
- **Pull Request**: コードレビューのコメント

### 良い質問の書き方

1. **明確なタイトル**: 何についての質問か分かりやすく
2. **コンテキスト**: 何をしようとしているか説明
3. **試したこと**: すでに試した解決策
4. **環境情報**: OS、Node.js バージョンなど
5. **コード例**: 該当する場合はコードを含める

---

## ドキュメントへの貢献

### ドキュメントの改善

- タイポの修正
- 説明の改善
- 例の追加
- 翻訳

### ドキュメント作成のガイドライン

- **明確**: 専門用語を避け、分かりやすく
- **簡潔**: 要点を押さえて簡潔に
- **例示**: コード例を含める
- **構造化**: 見出しとリストで整理

---

## ライセンス

コントリビューションすることにより、あなたの貢献が MIT License の下でライセンスされることに同意したものとみなされます。

---

## 謝辞

A-Chatへのコントリビューションに感謝します！あなたの貢献がプロジェクトをより良くします。

質問や不明点があれば、遠慮なく Issue や Discussion で聞いてください。

Happy contributing!
