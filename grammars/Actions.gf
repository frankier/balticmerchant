--# -path=.:present:prelude:translator
abstract Actions = Crates ** {
  flags startcat = CommandUtt ;
  cat
    CommandUtt ;
    Command ;
    ExchangeV2 ;
    DebtV2 ;
    City ;

    -- Descriptions, live here in Actions for now
    Description ;
  fun
    ActionUtt : Command -> CommandUtt ;

    GeneralExchangeAction : ExchangeV2 -> CommodityQuantity -> Command ;
    SpecificExchangeAction : ExchangeV2 -> Offer -> Command ;
    Buy : ExchangeV2 ;
    Sell : ExchangeV2 ;

    DebtAction : DebtV2 -> Money -> Command ;
    Borrow : DebtV2 ;
    PayBack : DebtV2 ;

    JetAction : City -> Command ;
    London : City ;
    Helsinki : City ;
    Stockholm : City ;

    -- Looking
    LookAction : Command ;
    CheckMoney : Command ;
    CheckInventory : Command ;

    -- Descriptions, live here in Actions for now
    LookAround : Offer -> Description ;
    Arrive : City -> Description ;
}
