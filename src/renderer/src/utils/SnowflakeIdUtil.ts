// utils/snowflake.ts
export class Snowflake {
    private static sequence = 0n;
    private static epoch = 1609459200000n; // 固定起始时间：2021-01-01 00:00:00
    private static workerId = 1n;
    private static datacenterId = 1n;

    private static workerIdBits = 5n;
    private static datacenterIdBits = 5n;
    private static sequenceBits = 12n;

    private static workerIdShift = Snowflake.sequenceBits;
    private static datacenterIdShift = Snowflake.sequenceBits + Snowflake.workerIdBits;
    private static timestampLeftShift = Snowflake.sequenceBits + Snowflake.workerIdBits + Snowflake.datacenterIdBits;
    private static sequenceMask = -1n ^ (-1n << Snowflake.sequenceBits);

    private static lastTimestamp = -1n;

    private static timeGen = () => BigInt(Date.now());

    public static nextId(): string {
        let timestamp = this.timeGen();

        if (timestamp < this.lastTimestamp) {
            throw new Error('Clock moved backwards. Refusing to generate id');
        }

        if (this.lastTimestamp === timestamp) {
            this.sequence = (this.sequence + 1n) & this.sequenceMask;
            if (this.sequence === 0n) {
                // 当前毫秒内的序列溢出，等待下一毫秒
                while ((timestamp = this.timeGen()) <= this.lastTimestamp) { }
            }
        } else {
            this.sequence = 0n;
        }

        this.lastTimestamp = timestamp;

        const id =
            ((timestamp - this.epoch) << this.timestampLeftShift) |
            (this.datacenterId << this.datacenterIdShift) |
            (this.workerId << this.workerIdShift) |
            this.sequence;

        return id.toString();
    }
}
