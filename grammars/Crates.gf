abstract Crates = Numeral ** {
  flags startcat = Offer ;
  cat
    Offer ;
    Commodity ;
    CommodityQuantity ;
    CommodityCrate ;
    Number ;
    Money ;
  fun
    OfferAt : CommodityQuantity -> Money -> Offer ;
    Euros : Number -> Money ;
    NNumeral : Numeral -> Number ;

    mkCommodityQuantity : CommodityCrate -> Number -> CommodityQuantity ;
    mkCommodityCrate : Commodity -> CommodityCrate ;

    Wine, Cheese, Fish : Commodity;
}
