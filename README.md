NEC BaaS datasource plugin for Grafana
======================================

* master: [![Build Status](https://travis-ci.org/nec-baas/grafana-baas-object-datasource.svg?branch=master)](https://travis-ci.org/nec-baas/grafana-baas-object-datasource)
* develop: [![Build Status](https://travis-ci.org/nec-baas/grafana-baas-object-datasource.svg?branch=develop)](https://travis-ci.org/nec-baas/grafana-baas-object-datasource)

概要
----

Grafana から NEC モバイルバックエンド基盤(NEC BaaS) に REST API でアクセスして
データを取得するための  Datasource plugin です。

インストール
------------

/var/lib/grafana/plugins ディレクトリ、または data/plugins ディレクトリ (Grafana 本体からの相対ディレクトリ)
に "baas-grafana-datasource" ディレクトリを作成し、
本ディレクトリ以下の全ファイルを前記ディレクトリにインストールしてください。

データソースの設定
-------------------

Grafana の設定画面から "NEC BaaS" データソースを追加してください。
設定項目は以下の通りです。

* HTTP URL: BaaS API サーバのベース URI を指定してください(例: "https://baas.example.com/api")
* Tenant ID: BaaSテナントIDを指定してください。
* App ID: BaaSアプリケーションIDを指定してください。
* App/Master Key: BaaSアプリケーション/マスターキーを指定してください。

ユーザ認証が必要な場合は、Basic Auth を指定して User/Password を入力してください。
Access を Browser に設定して Basic Auth を使用する場合は、With Credentials にチェックを入れてください。また、BaaS サーバのテナント設定で CORS有効・Access-Control-Allow-Credentials を許可し、CORS許可ドメインリストを正しく設定してください。
なお、Basic Auth を使用するためには、BaaS Server v7.5.0 以上が必要です。

Access が Server の場合は、クライアント証明書認証も利用可能です。

Dashboard / クエリ条件(Target)
-------------------------------

Dashboardを作成し、Data Source に上記で作成したデータソースを指定してください。

クエリ条件(target)は以下のように指定してください。

* Bucket: BaaS JSON Object Storage のバケット名を指定します。
* Alias: 凡例に表示する文字列を指定します。未入力の場合は、"bucket.Data filed" で表示されます。
* Data field: JSONフィールド名を指定します。
* Timestamp field: タイムスタンプのJSONフィールド名を指定します。未入力の場合は "updatedAt" が使用されます。
* Aggregation pipeline: Aggregation pipeline を JSON配列で指定します。未入力の場合は全件検索が実行されます。

### JSONフィールド名

JSON の深い階層のデータを取得する場合は、Data field にキー名(配列の場合は要素番号)を '.' で連結して指定することができます。

例えば以下のようなデータがバケット "bucket1" にあるとき、

    // 対象データ
    { payload: [ { temperature: 26.5, timestamp: "2018-01-01T00:00:00.000Z" } ], createdAt: "2018-06-29T00:00:00.000Z" }
    
上記データから temperature の値を抽出し、タイムスタンプとして timestamp を使用するする場合は、クエリ条件には以下のように指定します。

##### Bucket
    bucket1
##### Data field
    payload.0.temperature
##### Timestamp field
    payload.0.timestamp

### タイムスタンプフィールド値

タイムスタンプフィールドの値は、ISO 8601 形式、具体的には "YYYY-MM-DDTHH:MM:SS.sssZ" でなければなりません。これは Grafana が指定する日時範囲が ISO 8601 形式の文字列での指定となっており、本プラグインはこれをそのまま MongoDB の検索式 ($gte および $lte) にマップするためです。

### MongoDB Aggregation

MongoDB の Aggregation を指定することができます。
Pipelineは、Aggregation JSON 配列で指定してください。

以下に例を示します。

##### Aggregation pipeline

    [
      {
        "$match": {
          (クエリ式)
        }
      }
    ]

バージョン互換について
----------------------

ver 0.0.5 以前のバージョンで保存したクエリ条件とは互換性がありません。
ver 0.0.5 以前のプラグインからアップデートする場合は、クエリ条件を再設定してください。
