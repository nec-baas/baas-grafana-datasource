export class BaasConfigCtrl {
    static templateUrl = 'partials/config.html';
    current: any;

    constructor($scope) {
        console.log("BaasConfigCtrl: constructor");
        this.current.jsonData.tenantId = this.current.jsonData.tenantId || "-";
        this.current.jsonData.appId = this.current.jsonData.appId || "-";
        this.current.jsonData.appKey = this.current.jsonData.appKey || "-";
    }
}