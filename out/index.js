"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CATEGORY_COMBOBOX_NAME = "category";
const GRADE_COMBOBOX_NAME = "grade";
const DEFAULT_CATEGORY = "traitextract";
const DEFAULT_GRADE = 3;
const state = { grade: DEFAULT_GRADE, category: DEFAULT_CATEGORY, items: [], statData: {} };
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        state.items = yield getAuctionHouseData();
        state.statData = yield getStatFormatData();
        yield AttachChangedHandlers();
        yield refresh();
    });
}
function refresh() {
    return __awaiter(this, void 0, void 0, function* () {
        let data = state.items;
        let categories = [...new Set(data.map(x => x.category)).values()];
        yield refreshCategoryCombobox(categories);
        yield refreshGradeCombobox();
        let result = data
            .filter(x => x.category === state.category && (state.grade == 0 || x.grade === state.grade))
            .sort((x, y) => {
            if (x.minTrait === null && y.minTrait === null)
                return y.minPrice - x.minPrice;
            if (x.minTrait === null)
                return y.minTrait.price - x.minPrice;
            if (y.minTrait === null)
                return y.minPrice - x.minTrait.id;
            return y.minTrait.price - x.minTrait.price;
        })
            .map(x => {
            var _a, _b;
            let traitId = x.minTrait == null ? null : x.traitIds[x.minTrait.id];
            let traitName = traitId == null ? "" : (_b = (_a = state.statData.get(traitId)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "";
            let price = x.minTrait == null ? x.minPrice : x.minTrait.price;
            let count = x.minTrait == null ? x.count : x.minTrait.count;
            return `${price} lucent = ${x.name} (${traitName}, ${count}x)`;
        });
        document.getElementById("output").textContent = result.join("\n");
    });
}
//#region Rest
function getAuctionHouseData() {
    return __awaiter(this, void 0, void 0, function* () {
        let rs = yield fetch("https://corsproxy.io/?https://questlog.gg/throne-and-liberty/api/trpc/actionHouse.getAuctionHouse?input={\"language\":\"en\",\"regionId\":\"eu-e\"}");
        let input = yield rs.json();
        let data = input.result.data.map(x => {
            var _a;
            let trait;
            let traitItems = x.traitItems.filter(x => x.inStock > 1);
            if (traitItems.length === 0)
                trait = null;
            else
                trait = traitItems.reduce((x, y) => y.minPrice > x.minPrice ? y : x);
            var traitData = trait === null ? null : ({ price: trait.minPrice, id: trait.traitId, count: trait.inStock });
            return ({
                id: x.id,
                category: x.mainCategory,
                grade: x.grade,
                name: x.name,
                minPrice: x.minPrice,
                count: x.inStock,
                traitIds: (_a = x.traitIds) !== null && _a !== void 0 ? _a : new Map(),
                minTrait: traitData
            });
        });
        return data;
    });
}
function getStatFormatData() {
    return __awaiter(this, void 0, void 0, function* () {
        let rs = yield fetch("https://corsproxy.io/?https://questlog.gg/throne-and-liberty/api/trpc/statFormat.getStatFormat?input={\"language\":\"en\"}");
        let input = yield rs.json();
        let map = new Map();
        for (let key in input.result.data) {
            map.set(key, ({ id: key, name: input.result.data[key].name }));
        }
        return map;
    });
}
//#endregion
//#region ComboBoxes
function getCombobox(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return document.getElementById(id);
    });
}
function refreshCategoryCombobox(categories) {
    return __awaiter(this, void 0, void 0, function* () {
        let selector = yield getCombobox(CATEGORY_COMBOBOX_NAME);
        if (selector.options.length === 0) {
            for (let idx in categories.sort()) {
                let category = categories[idx];
                let option = new Option(category, category);
                selector.add(option);
            }
        }
        selector.selectedIndex = [...selector.options].findIndex(x => x.value === state.category);
    });
}
function refreshGradeCombobox() {
    return __awaiter(this, void 0, void 0, function* () {
        let selector = yield getCombobox(GRADE_COMBOBOX_NAME);
        if (selector.options.length === 0) {
            const grades = ["<All>", "Common", "Uncommon", "Rare", "Epic"];
            for (let idx in grades) {
                let option = new Option(grades[idx], idx);
                selector.add(option);
            }
        }
        selector.selectedIndex = [...selector.options].findIndex(x => x.value === state.grade.toString());
    });
}
//#endregion
//#region ChangedHandler
function AttachChangedHandlers() {
    return __awaiter(this, void 0, void 0, function* () {
        let categoryComboBox = yield getCombobox(CATEGORY_COMBOBOX_NAME);
        categoryComboBox.onchange = () => {
            state.category = categoryComboBox.value;
            refresh();
        };
        let gradeComboBox = yield getCombobox(GRADE_COMBOBOX_NAME);
        gradeComboBox.onchange = () => {
            state.grade = parseInt(gradeComboBox.value);
            refresh();
        };
    });
}
//#endregion
window.addEventListener("load", () => main());
