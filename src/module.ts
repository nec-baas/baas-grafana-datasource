import {BaasDatasource} from "datasource";
import {BaasDatasourceQueryCtrl} from "./query_ctrl";

class BaasConfigCtrl {
    static templateUrl: string
}
BaasConfigCtrl.templateUrl = 'partials/config.html';

export {
    BaasDatasource as DataSource,
    BaasDatasourceQueryCtrl as QueryCtrl,
    BaasConfigCtrl as ConfigCtrl
};
