export interface GetAuctionHouseResponse
{
    result: Result
}

export interface Result
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


export interface AuctionHouseItemDTO
{
    id: string
    category: string
    grade: number
    name: string
    traitIds: Map<string, string>
    minTrait: TraitDTO | null
}

export interface TraitDTO
{
    id: number
    price: number
}

export interface State
{
    category: string
    grade: number
    items: Array<AuctionHouseItemDTO>
}