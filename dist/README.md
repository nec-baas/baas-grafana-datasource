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

Grafana の設定画面から "NEC BaaS Object Storage Datasource" データソースを追加してください。
設定項目は以下の通りです。

* HTTP URL: BaaS API サーバのベース URI を指定してください(例: "https://baas.example.com/api")
* HTTP Access: BaaS API サーバへのアクセス方法を選択してください
* Tenant ID: BaaSテナントIDを指定してください。
* App ID: BaaSアプリケーションIDを指定してください。
* App/Master Key: BaaSアプリケーション/マスターキーを指定してください。

### アクセス方法

BaaS APIサーバへのアクセス方法を選択します。

* Server(default): Grafana サーバを Proxy として BaaS API サーバに接続します。よって、Grafana サーバから BaaS API サーバに接続可能である必要があります。
* Browser: 使用しているブラウザから直接 BaaS API サーバに接続します。ブラウザから BaaS API サーバに接続できるよう Proxy 等の設定をしてください。また、CORSとなるため、BaaS サーバのテナント設定で CORS有効・Access-Control-Allow-Credentials を許可に設定し、CORS許可ドメインリストを正しく設定してください。

### ユーザ認証

ユーザ認証に Basic 認証が利用可能です。Basic Auth を指定して User/Password を入力してください。
アクセス方法が Browser で Basic Auth を使用する場合は、With Credentials にチェックを入れてください。
なお、Basic Auth を使用するためには、BaaS Server v7.5.0 以上が必要です。

アクセス方法が Server の場合は、クライアント証明書認証も利用可能です。TLS Client Auth を設定して、Client Cert/Client Key を入力してください。自己署名の証明書を使用する場合は、With CA Cert を設定し、CA Cert を入力してください。

Dashboard / クエリ条件(Target)
-------------------------------

Dashboardを作成し、Data Source に上記で作成したデータソースを指定してください。

クエリ条件(target)は以下のように指定してください。

* Bucket: BaaS JSON Object Storage のバケット名を指定します。
* Format as: 生成するデータのタイプを選択します。
  * [Time series]： 時系列データを生成します
  * [Table]： テーブルデータを生成します
* Create data with: データの指定方式を選択します。
  * [Data field]： データフィールド指定方式
    * Data field: JSONフィールド名を指定します。
    * Alias: 凡例に表示する文字列を指定します。未入力の場合は、"bucket.Data field" で表示されます。
  * [Series Name/Value key]： 系列名・系列値キー指定方式
    * Series Name key: 系列名として使用するデータのJSONフィールド名を指定します。
    * Series Value key: 系列値として使用するデータのJSONフィールド名を指定します。
* Timestamp field: タイムスタンプのJSONフィールド名を指定します。未入力の場合は "updatedAt" が使用されます。
* Aggregation pipeline: Aggregation pipeline を JSON配列で指定します。未入力の場合は全件検索が実行されます。

### 生成データタイプ
* 時系列データ  
Graphパネル等で使用可能な時系列データを生成します。  
取得データにTimestamp field が含まれていない場合は、Dashboard に設定されている時間範囲の終了時刻を使用して時系列データを生成します。

* テーブルデータ  
Tableパネル等で使用可能なテーブルデータを生成します。

### データ指定方式
* データフィールド指定方式  
Data field に指定されたフィールドからデータを生成します。Alias に指定された文字列を凡例として表示します。Add Data field ボタンでデータフィールドを追加することができます。

* 系列名・系列値キー指定方式  
Series Name key に指定されたフィールドの値を系列名とし、Series Value key に指定されたフィールドの値を系列値としてデータを生成します。

### JSONフィールド名

JSON の深い階層のデータを取得する場合は、Data field にキー名(配列の場合は要素番号)を '.' で連結して指定することができます。

例えば以下のようなデータがバケット "bucket1" にあるとき、

    // 対象データ
    {
      payload: [
        {
          temperature: 26.5,
          timestamp: "2018-01-01T00:00:00.000Z"
        }
      ],
      createdAt: "2018-06-29T00:00:00.000Z"
    }
    
上記データから temperature の値を抽出し、タイムスタンプとして timestamp を使用する場合は、クエリ条件には以下のように指定します。

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
検索条件を追加したい場合は、Aggregation で検索条件を指定してください。
Aggregation pipelineは、JSON 配列で入力します。

時系列データ選択時、$project等を使用して取得データのフィールドを選択する場合は、取得データにTimestamp field が含まれるようにしてください。

以下に temperature が 50 以上のものを絞り込むときの設定例を示します。

##### Aggregation pipeline

    [
      {
        "$match": {
          "temperature": {
            "$gte": 50
           }
         }
      }
    ]

### Variables(変数の利用)

以下のクエリ条件には変数を使用することができます。

* Bucket
* Data field
* Series Name key
* Series Value key
* Timestamp field

Bucket には、BaaS API サーバから取得したバケット一覧を使用することができます。
以下のように変数設定してください。

* General > Type を "Query" に設定
* Query Options > Data source を NEC BaaS Object Storage Datasource で作成したデータソースに設定
* Query Options > Query に "buckets" を入力

### クエリ条件の設定例
可視化するデータのフォーマットに対する、各パネルのクエリ条件の設定例を記載します。

#### データ例1 (時系列データ1) 
```json
{ "temperature": 15, "humidity": 50, "updatedAt": "2019-02-07T01:00:00.000Z" }
{ "temperature": 17, "humidity": 49, "updatedAt": "2019-02-07T02:00:00.000Z" }
{ "temperature": 18, "humidity": 48, "updatedAt": "2019-02-07T03:00:00.000Z" }
{ "temperature": 21, "humidity": 48, "updatedAt": "2019-02-07T04:00:00.000Z" }
{ "temperature": 25, "humidity": 48, "updatedAt": "2019-02-07T05:00:00.000Z" }
```
##### 設定例
| パネル | Format as | Create data with | Data field | Series Name key | Series Value key | 表示 |
|--------|-----------|------------------|------------|-----------------|------------------|------|
| **Graph** | Time series | Data field | temperature<br>humidity | - | - | temperature と humidity の2つのラインが表示されます。 |
| **SingleStats** | Time series | Data field | temperature | - | - | temperature フィールドについて、SingleStats パネルの Optionsタブ＞Value＞Stat で選択した集計値が表示されます。 |
| **Table** | Table | Data field | temperature<br>humidity | - | - | temperature と humidity を列項目としたテーブルが表示されます。 |
| **Pie Chart** | - | - | - | - | - | ※時系列データに対する利用は非推奨 |
  
#### データ例2 (時系列データ2) 
```json
{ "type": "temperature", "value": 15, "updatedAt": "2019-02-07T01:00:00.000Z" }
{ "type": "humidity", "value": 50, "updatedAt": "2019-02-07T01:00:00.000Z" }
{ "type": "temperature", "value": 17, "updatedAt": "2019-02-07T02:00:00.000Z" }
{ "type": "humidity", "value": 49, "updatedAt": "2019-02-07T02:00:00.000Z" }
{ "type": "temperature", "value": 18, "updatedAt": "2019-02-07T03:00:00.000Z" }
{ "type": "humidity", "value": 48, "updatedAt": "2019-02-07T03:00:00.000Z" }
```

##### 設定例
| パネル | Format as | Create data with | Data field | Series Name key | Series Value key | 表示 |
|--------|-----------|------------------|------------|-----------------|------------------|------|
| **Graph** | Time series | Series Name/Value key | - | type | value | temperature と humidity の2つのラインが表示されます。 |
| **SingleStats** | - | - | - | - | - | ※本データフォーマットに対する利用は非推奨 |
| **Table** | Table | Series Name/Value key | - | type | value | type と value を列項目としたテーブルが表示されます。type列には temperature と humidity が表示され、value 列には各項目の最終取得値が表示されます。 |
| **Pie Chart** | - | - | - | - | - | ※時系列データに対する利用は非推奨 |

#### データ例3 (集計データ1)
※Aggregation pipeline の使用を想定
```json
{ "High": 123 }
{ "Middle": 456 }
{ "Low": 78 }
```

##### 設定例
| パネル | Format as | Create data with | Data field | Series Name key | Series Value key | 表示 |
|--------|-----------|------------------|------------|-----------------|------------------|------|
| **Graph** | - | - | - | - | - | ※非対応 |
| **SingleStats** | Time series | Data field | High | - | - | High の値が表示されます。 |
| **Table** | Table | Data field | High<br>Middle<br>Low | - | - | High、Middle、Low を列項目としたテーブルが表示されます。 |
| **Pie Chart** | Time series | Data field | High<br>Middle<br>Low | - | - | High、Middle、Low の値が表示されます。 |

#### データ例4 (集計データ2) 
※Aggregation pipeline の使用を想定
```json
{ "level": "High", "count": 123 }
{ "level": "Middle", "count": 456 }
{ "level": "Low", "count": 78 }
```

##### 設定例
| パネル | Format as | Create data with | Data field | Series Name key | Series Value key | 表示 |
|--------|-----------|------------------|------------|-----------------|------------------|------|
| **Graph** | - | - | - | - | - | ※非対応 |
| **SingleStats** | - | - | - | - | - | ※本データフォーマットに対する利用は非推奨 |
| **Table** | Table | Series Name/Value key | - | level | count | level と count を列項目としたテーブルが表示されます。level 列には High、Middle、Low が表示され、count 列には各項目の値が表示されます。 |
| **Pie Chart** | Time series | Series Name/Value key | - | level | count | High、Middle、Low の値が表示されます。 |

バージョン互換について
----------------------

ver 7.5.0 と ver 7.5.1 には互換性があります。  
バージョンアップ後は、下記のクエリ条件で動作します。
* Format as　　　　: Time series（時系列データ）  
* Create data with　: Data field（データフィールド指定方式）  
* Data field(1行目)　: Data field（ver 7.5.0）  
* Alias(1行目)　　 　: Alias（ver 7.5.0）  

ver 0.0.5 以前 と ver 7.5.0 以降ではGrafanaプラグインとして互換性がありません。
データソース設定、クエリ条件を再設定して使用してください。
