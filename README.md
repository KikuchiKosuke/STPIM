# STPIM

Java 11 / Servlet 4 / JSP で動くスケジュール管理アプリの試作です。画面は src/main/webapp、Servlet・サービス・モデル・DAO は src/main/java/stpim にあります。

## Eclipseで起動

1. Eclipseの「ファイル」→「インポート」→「既存プロジェクトをワークスペースへ」で、このリポジトリを選びます。.project と .classpath を含む stpim プロジェクトです。
2. Eclipseの「サーバー」ビューでTomcat 9を追加します。プロジェクトの実行環境はJava 11です。
3. stpim を右クリックして「実行」→「サーバーで実行」を選びます。
4. ブラウザーで http://localhost:8080/stpim/ を開きます。通常はログイン画面へ移動します。

デモアカウントは demo / demo1234 です。新規登録もできます。

## 含まれる機能

- PBKDF2でパスワードをハッシュ化する新規登録とログイン、8時間のセッション、ログアウト
- 月カレンダーと日ごとの時間制・優先順位ブロック
- 作成・編集・削除・日付を選んでの複製
- 右スワイプまたは「クリア」ボタンでの完了、優先順位ブロックの開始時刻、終了時刻の手入力、1回だけの取り消し
- 未処理状態、タイムアタックの履歴・自己ベスト、累計と状態別の記録
- ユーザーごとのブロック照会と更新を行うDAO

## 保存範囲

現在の InMemoryUserDao / InMemoryBlockDao はTomcatのメモリに保存する試作用DAOです。Tomcatを再起動すると、登録ユーザーと予定は消え、デモデータが再作成されます。PostgreSQLのスキーマ案は sql/schema.sql にありますが、JDBC接続と永続DAOは未接続です。

前回作成したブラウザー単体版は prototype/ に残しています。Eclipse/Tomcatで動かす場合は /stpim/ を開いてください。Java/JSP版は src/main/webapp/ から配信されます。
