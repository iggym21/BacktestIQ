export const DEFAULT_CODE = `def generate_signals(df):
    """
    df: pandas DataFrame with columns: open, high, low, close, volume
    Returns: pandas Series with values 1 (buy), -1 (sell), 0 (hold)
    """
    import pandas as pd
    signals = pd.Series(0, index=df.index)

    # Example: 50/200 SMA crossover
    sma50 = df['close'].rolling(50).mean()
    sma200 = df['close'].rolling(200).mean()

    signals[sma50 > sma200] = 1
    signals[sma50 < sma200] = -1

    return signals
`;
