# Color Encoding TODO

## Smart Encoding Strategy for ZK Proof

We need to encode 3 animation parameters (Pusher Slowness, Cleaner Slowness, Rectangle Count) in the existing 3 uint8 slots without rewriting the zero-knowledge proof. The color palette index (0-15) will be **derived** from these 3 values using a deterministic function instead of being user-selected. This allows us to encode all required animation parameters while maintaining backward compatibility with the existing proof system. Possible derivation approaches: simple hash function `(pusher + cleaner*7 + rect*3) % 16`, combined bitwise operation, or aesthetic mapping (faster params → warmer colors).
