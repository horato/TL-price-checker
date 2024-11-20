
//#region GetAuctionHouse

export interface GetAuctionHouseResponse
{
    result: GetAuctionHouseResult
}

export interface GetAuctionHouseResult
{
    data: AuctionHouseItem[]
}

export interface AuctionHouseItem
{
    id: string
    name: string
    icon: string
    grade: number
    mainCategory: string
    subCategory: string
    traitIds?: Map<string, string>
    minPrice: number
    inStock: number
    traitItems: TraitItem[]
    subSubCategory?: string
}

export interface TraitItem
{
    traitId: number
    minPrice: number
    inStock: number
}

//#endregion

//#region GetStatFormat

export interface GetStatFormatResponse
{
    result: GetStatFormatResult
}

export interface GetStatFormatResult
{
    data: { [key: string]: StatItem };
}

export interface StatItem
{
    name: string
    valueFormat: string
    tooltipTitle: string
    tooltipDescription: string
    multiplier: number
    invert: boolean
}

//#endregion

export interface AuctionHouseItemDTO
{
    id: string
    category: string
    grade: number
    name: string
    minPrice: number
    count: number
    traitIds: Map<string, string>
    minTrait: TraitDTO | null
}

export interface TraitDTO
{
    id: number
    price: number
    count: number
}

export interface State
{
    category: string
    grade: number
    items: Array<AuctionHouseItemDTO>
    statData: Map<string, StatDTO>
}


export interface StatDTO
{
    id: string
    name: string
}
