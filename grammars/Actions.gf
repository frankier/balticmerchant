abstract Actions = Crates ** {
  flags startcat = CommandUtt ;
  cat
    CommandUtt ;
    Command ;
    ExchangeV2 ;
    DebtV2 ;
  fun
    ActionUtt : Command -> CommandUtt ;

    ExchangeAction : ExchangeV2 -> CommodityQuantity -> Command ;
    Buy : ExchangeV2 ;
    Sell : ExchangeV2 ;

    DebtAction : DebtV2 -> Money -> Command ;
    Borrow : DebtV2 ;
    PayBack : DebtV2 ;
}
