NEC BaaS datasource plugin for Grafana
======================================

概要
----

Grafana から BaaS に REST API でアクセスしてデータを取得するための  Datasource plugin です。

インストール
------------

本ディレクトリ以下を grafana の data/plugin/baas-grafana-datasource/ ディレクトリにコピーしてください。

データソースの設定
-------------------

Grafana の設定画面から "NEC BaaS" データソースを追加してください。
設定項目は以下の通りです。

* HTTP URL: BaaS API サーバのベース URI を指定してください。
* HTTP Access: Server(Default) を指定してください。
* Tenant ID: BaaSテナントID
* Application ID: BaaSアプリIDを指定してください。
* App/Master Key: BaaSアプリ/マスターキーを指定してください。

ユーザ認証が必要な場合は、Basic Auth を指定して User/Password を入力してください。
Basic Auth を使用するためには、BaaS Server v7.5.0 beta3 以上が必要です。

Dashboard
----------

Dashboardを作成し、Data Source に上記で作成したデータソースを指定してください。

クエリ条件は以下のように指定してください。

    bucketName.fieldName

* bucketName: BaaS Object Storage のバケット名を指定します。
* fieldName: JSONフィールド名を指定します。

複数のクエリを指定することができますが、全クエリの bucketName はすべて同一でなければなりません。

JSON の深い階層のデータを取得する場合は、fieldName にキー名を '.' で連携して指定することができます。
(配列の場合は要素番号)。

例えば以下のようなデータがあったとき、

    // 対象データ
    { payload: [ { temperature: 26.5, ... } ], createdAt: "2018-06-29T00:00:00.000Z" }
    
上記データから temperature の値を抽出する場合は、fieldName には "payload.0.temperature" と指定します。



