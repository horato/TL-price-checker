import { AuctionHouseItemDTO, GetAuctionHouseResponse, GetStatFormatResponse, StatDTO, State, TraitDTO, TraitItem } from "./definitions";

const CATEGORY_COMBOBOX_NAME = "category"
const GRADE_COMBOBOX_NAME = "grade"
const DEFAULT_CATEGORY = "traitextract"
const DEFAULT_GRADE = 3

const state = { grade: DEFAULT_GRADE, category: DEFAULT_CATEGORY, items: [], statData: {} } as State

async function main()
{
    state.items = await getAuctionHouseData();
    state.statData = await getStatFormatData();

    await AttachChangedHandlers()
    await refresh()
}

async function refresh()
{
    let data = state.items

    let categories = [...new Set(data.map(x => x.category)).values()];
    await refreshCategoryCombobox(categories);
    await refreshGradeCombobox();

    let result = data
        .filter(x => x.category === state.category && (state.grade == 0 || x.grade === state.grade))
        .sort((x, y) =>
        {
            if (x.minTrait === null && y.minTrait === null)
                return y.minPrice - x.minPrice
            if (x.minTrait === null)
                return y.minTrait.price - x.minPrice;
            if (y.minTrait === null)
                return y.minPrice - x.minTrait.id;

            return y.minTrait.price - x.minTrait.price;
        })
        .map(x =>
        {
            let traitId = x.minTrait == null ? null : x.traitIds[x.minTrait.id];
            let traitName = traitId == null ? "" : state.statData.get(traitId)?.name ?? "";
            let price = x.minTrait == null ? x.minPrice : x.minTrait.price
            let count = x.minTrait == null ? x.count : x.minTrait.count;


            return `${price} lucent = ${x.name} (${traitName}, ${count}x)`
        })

    document.getElementById("output")!.textContent = result.join("\n");
}

//#region Rest

async function getAuctionHouseData(): Promise<Array<AuctionHouseItemDTO>>
{
    let rs = await fetch("https://corsproxy.io/?https://questlog.gg/throne-and-liberty/api/trpc/actionHouse.getAuctionHouse?input={\"language\":\"en\",\"regionId\":\"eu-e\"}");
    let input = await rs.json() as GetAuctionHouseResponse;
    let data: Array<AuctionHouseItemDTO> = input.result.data.map(x =>
    {
        let trait: TraitItem | null;
        let traitItems = x.traitItems.filter(x => x.inStock > 1);
        if (traitItems.length === 0)
            trait = null
        else
            trait = traitItems.reduce((x: TraitItem, y: TraitItem) => y.minPrice > x.minPrice ? y : x);

        var traitData: TraitDTO | null = trait === null ? null : ({ price: trait.minPrice, id: trait.traitId, count: trait.inStock });
        return (
            {
                id: x.id,
                category: x.mainCategory,
                grade: x.grade,
                name: x.name,
                minPrice: x.minPrice,
                count: x.inStock,
                traitIds: x.traitIds ?? new Map<string, string>(),
                minTrait: traitData
            })
    })

    return data;
}

async function getStatFormatData(): Promise<Map<string, StatDTO>>
{
    let rs = await fetch("https://corsproxy.io/?https://questlog.gg/throne-and-liberty/api/trpc/statFormat.getStatFormat?input={\"language\":\"en\"}");
    let input = await rs.json() as GetStatFormatResponse;

    let map = new Map();
    for (let key in input.result.data)
    {
        map.set(key, ({ id: key, name: input.result.data[key].name }))
    }

    return map;
}

//#endregion

//#region ComboBoxes

async function getCombobox(id: string): Promise<HTMLSelectElement>
{
    return document.getElementById(id) as HTMLSelectElement;
}

async function refreshCategoryCombobox(categories: Array<string>): Promise<void>
{
    let selector = await getCombobox(CATEGORY_COMBOBOX_NAME);
    if (selector.options.length === 0)
    {
        for (let idx in categories.sort())
        {
            let category = categories[idx]
            let option = new Option(category, category);
            selector.add(option);
        }
    }

    selector.selectedIndex = [...selector.options].findIndex(x => x.value === state.category)
}

async function refreshGradeCombobox(): Promise<void>
{
    let selector = await getCombobox(GRADE_COMBOBOX_NAME);
    if (selector.options.length === 0)
    {
        const grades = ["<All>", "Common", "Uncommon", "Rare", "Epic"]
        for (let idx in grades)
        {
            let option = new Option(grades[idx], idx);
            selector.add(option);
        }
    }

    selector.selectedIndex = [...selector.options].findIndex(x => x.value === state.grade.toString())
}

//#endregion

//#region ChangedHandler

async function AttachChangedHandlers()
{
    let categoryComboBox = await getCombobox(CATEGORY_COMBOBOX_NAME);
    categoryComboBox.onchange = () =>
    {
        state.category = categoryComboBox.value
        refresh()
    }

    let gradeComboBox = await getCombobox(GRADE_COMBOBOX_NAME);
    gradeComboBox.onchange = () =>
    {
        state.grade = parseInt(gradeComboBox.value)
        refresh()
    }
}

//#endregion

window.addEventListener("load", () => main())