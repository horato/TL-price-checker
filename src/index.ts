import { AuctionHouseItemDTO, GetAuctionHouseResponse, GetStatFormatResponse, StatDTO, State, TraitDTO, TraitItem } from "./definitions";

const CATEGORY_COMBOBOX_NAME = "category"
const GRADE_COMBOBOX_NAME = "grade"
const DEFAULT_CATEGORY = "traitextract"
const DEFAULT_GRADE = 3
const ITEM_COUNT_LIMIT = 2

const state = { grade: DEFAULT_GRADE, category: DEFAULT_CATEGORY, items: [], statData: {} } as State

async function main()
{
    state.items = await getAuctionHouseData();
    state.statData = await getStatFormatData();

    attachChangedHandlers()
    refresh()
}

function refresh()
{
    let data = state.items

    let categories = [...new Set(data.map(x => x.category)).values()];
    refreshCategoryCombobox(categories);
    refreshGradeCombobox();

    let result = data
        .filter(x => x.category === state.category && (state.grade == 0 || x.grade === state.grade))
        .filter(x => getCount(x) >= ITEM_COUNT_LIMIT)
        .sort((x, y) =>
        {
            if (x.mostExpensiveTrait === null && y.mostExpensiveTrait === null)
                return y.minPrice - x.minPrice
            if (x.mostExpensiveTrait === null)
                return y.mostExpensiveTrait.price - x.minPrice;
            if (y.mostExpensiveTrait === null)
                return y.minPrice - x.mostExpensiveTrait.price;

            return y.mostExpensiveTrait.price - x.mostExpensiveTrait.price;
        })
        .map(x =>
        {
            let traitId = x.mostExpensiveTrait == null ? null : x.mostExpensiveTrait.id;
            let traitName = traitId == null ? "" : state.statData.get(traitId)?.name ?? "";
            let price = x.mostExpensiveTrait == null ? x.minPrice : x.mostExpensiveTrait.price
            let description = [traitName, `${getCount(x)}x`].filter(Boolean).join(", ")

            let summary = document.createElement("summary");
            summary.innerText = `${price} lucent = ${x.name} (${description})`

            let table = document.createElement("table");
            table.style.margin = "0 0 0 1%"

            let traits = x.traits.sort((a, b) => b.price - a.price).map(x => `${state.statData.get(x.id).name} - ${x.price} lucent (${x.count}x)`)
            traits.forEach(x =>
            {
                let cell = document.createElement("td");
                cell.textContent = x;

                let row = document.createElement("tr");
                row.appendChild(cell)
                table.appendChild(row)
            })

            let details = document.createElement("details");
            details.appendChild(summary)
            details.appendChild(table)

            return details;
        })

    let output = document.getElementById("output");
    output.replaceChildren(...result)
}

function getCount(item: AuctionHouseItemDTO)
{
    return item.mostExpensiveTrait == null ? item.count : item.mostExpensiveTrait.count;
}

//#region Rest

async function getAuctionHouseData(): Promise<Array<AuctionHouseItemDTO>>
{
    let rs = await fetch("https://corsproxy.io/?https://questlog.gg/throne-and-liberty/api/trpc/actionHouse.getAuctionHouse%3Finput={\"language\":\"en\",\"regionId\":\"eu-f\"}");
    let input = await rs.json() as GetAuctionHouseResponse;
    let data: Array<AuctionHouseItemDTO> = input.result.data.map(x =>
    {
        let trait: TraitItem | null;
        let traitItems = x.traitItems.filter(x => x.inStock >= ITEM_COUNT_LIMIT);
        if (traitItems.length === 0)
            trait = null
        else
            trait = traitItems.reduce((x: TraitItem, y: TraitItem) => y.minPrice > x.minPrice ? y : x);

        return (
            {
                id: x.id,
                category: x.mainCategory,
                grade: x.grade,
                name: x.name,
                minPrice: x.minPrice,
                count: x.inStock,
                mostExpensiveTrait: createTraitDTO(trait, x.traitIds),
                traits: x.traitItems.map(y => createTraitDTO(y, x.traitIds))
            })
    })

    return data;
}

function createTraitDTO(trait: TraitItem, traitIds: { [key: number]: string; }): TraitDTO | null
{
    return trait == null ? null :
        ({
            price: trait.minPrice,
            id: traitIds[trait.traitId],
            count: trait.inStock
        });
}

async function getStatFormatData(): Promise<Map<string, StatDTO>>
{
    let rs = await fetch("https://corsproxy.io/?https://questlog.gg/throne-and-liberty/api/trpc/statFormat.getStatFormat%3Finput={\"language\":\"en\"}");
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

function getCombobox(id: string): HTMLSelectElement
{
    return document.getElementById(id) as HTMLSelectElement;
}

function refreshCategoryCombobox(categories: Array<string>): void
{
    let selector = getCombobox(CATEGORY_COMBOBOX_NAME);
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

function refreshGradeCombobox(): void
{
    let selector = getCombobox(GRADE_COMBOBOX_NAME);
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

function attachChangedHandlers()
{
    let categoryComboBox = getCombobox(CATEGORY_COMBOBOX_NAME);
    categoryComboBox.onchange = () =>
    {
        state.category = categoryComboBox.value
        refresh()
    }

    let gradeComboBox = getCombobox(GRADE_COMBOBOX_NAME);
    gradeComboBox.onchange = () =>
    {
        state.grade = parseInt(gradeComboBox.value)
        refresh()
    }
}

//#endregion

window.addEventListener("load", () => main())