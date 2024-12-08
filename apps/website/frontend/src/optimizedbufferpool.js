
export default class OptimizedBufferPool {
  constructor(maxPoolSize) {
    this.pools = new Map();
    this.maxPoolSize = maxPoolSize;
    this.totalBuffers = 0;
  }

  get(size) {
    if (!this.pools.has(size)) {
      this.pools.set(size, []);
      //console.log('Created new pool for size:', size);
    }

    const pool = this.pools.get(size);
    if (pool.length > 0) {
      this.totalBuffers--;
      return pool.pop();
    }

    return new Uint8Array(size);
  }

  return(buffer) {
    const size = buffer.length;
    if (!this.pools.has(size)) {
      this.pools.set(size, []);
    }

    const pool = this.pools.get(size);
    // Zero out the buffer before returning it to pool
    buffer.fill(0);

    if (pool.length < this.maxPoolSize && this.totalBuffers < this.maxPoolSize * 2) {
      pool.push(buffer);
      this.totalBuffers++;
    }
  }

  cleanup() {
    for (const [size, pool] of this.pools) {
      while (pool.length > 0) { // Remove all buffers
        const buffer = pool.pop();
        if (buffer) buffer.fill(0); // Zero out before releasing
      }
      this.pools.delete(size); // Remove the pool
    }
    this.totalBuffers = 0;
  }  
}