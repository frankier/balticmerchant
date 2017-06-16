instance LexCratesEng of LexCrates =
  open
    SyntaxEng,
    ParadigmsEng
  in {
  oper
    crateof_CN2CN = \comm -> mkCN (mkN2 (mkN "crate") possess_Prep) (mkNP comm);

    {- TODO autogenerate items -}
    wine_N = mkN "wine" ;
    cheese_N = mkN "cheese" ;
    fish_N = mkN "fish" ;

    at_Prep = mkPrep "at" ;
    each_Adv = mkAdv "each" ;
    euro_N = mkN "euro" ;
}
