abstract Crates = Numeral ** {
  flags startcat = Offer ;
  cat
    Offer ;
    Commodity ;
    CommodityQuantity ;
    Number ;
    Money ;
  fun
    OfferAt : CommodityQuantity -> Money -> Offer ;
    Euros : Number -> Money ;
    NNumeral : Numeral -> Number ;

    mkCommodityQuantity : Commodity -> Number -> CommodityQuantity ;

    Wine, Cheese, Fish : Commodity;
}
