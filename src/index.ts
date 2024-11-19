import { AuctionHouseItemDTO, GetAuctionHouseResponse, State, TraitDTO, TraitItem } from "./definitions";

const CATEGORY_COMBOBOX_NAME = "category"
const GRADE_COMBOBOX_NAME = "grade"
const DEFAULT_CATEGORY = "traitextract"
const DEFAULT_GRADE = 3

const state = { grade: DEFAULT_GRADE, category: DEFAULT_CATEGORY, items: [] } as State

async function main()
{
    state.items = await getAuctionHouseData();
    await AttachChangedHandlers()
    await refresh()
}

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
        .map(x => { return `${x.minTrait == null ? x.minPrice : x.minTrait.price} lucent = ${x.name} (${x.traitIds[x?.minTrait?.id]})` })

    document.getElementById("output")!.textContent = result.join("\n");
}

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

        var traitData: TraitDTO | null = trait === null ? null : ({ price: trait.minPrice, id: trait.traitId });
        return (
            {
                id: x.id,
                category: x.mainCategory,
                grade: x.grade,
                name: x.name,
                minPrice: x.minPrice,
                traitIds: x.traitIds ?? new Map<string, string>(),
                minTrait: traitData
            })
    })

    return data;
}

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

window.addEventListener("load", () => main())