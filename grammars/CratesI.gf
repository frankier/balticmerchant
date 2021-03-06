incomplete concrete CratesI of Crates = Numeral **
  open
    Syntax,
    LexCrates
  in {
  lincat
    Offer = NP ;
    Commodity = CN ;
    CommodityQuantity = NP ;
    Number = Card ;
    Money = NP;
  lin
    OfferAt cq m = mkNP cq (offerPerCrate m);
    Euros n = mkNP n euro_N ;
    NNumeral n = mkCard <lin Numeral n : Numeral> ;

    mkCommodityQuantity commodity number = mkNP number (crateof_CN2CN commodity) ;

    Wine = mkCN wine_N ;
    Cheese = mkCN cheese_N ;
    Fish = mkCN fish_N ;
  oper
    offerPerCrate : NP -> Adv = \m -> mkAdv at_Prep (mkNP m each_Adv) ;
}
