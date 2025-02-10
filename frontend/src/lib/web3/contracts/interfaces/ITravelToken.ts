export interface ITravelToken {
    // Fonctions de base ERC20
    balanceOf(address: string): Promise<bigint>;
    approve(spender: string, amount: bigint): Promise<void>;
    transfer(to: string, amount: bigint): Promise<boolean>;
    transferFrom(from: string, to: string, amount: bigint): Promise<boolean>;
    allowance(owner: string, spender: string): Promise<bigint>;
  
    // Fonctions spécifiques de mon TravelToken
    buyTokens(): Promise<void>;
    withdrawBNB(): Promise<void>;
    tokenPrice(): Promise<bigint>;
}
  
  