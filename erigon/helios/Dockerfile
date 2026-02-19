# Build Helios from source
FROM rust:1.75-alpine AS builder

RUN apk add --no-cache musl-dev openssl-dev openssl-libs-static

WORKDIR /build
RUN git clone --depth 1 https://github.com/a16z/helios.git . \
    && cargo build --release

# Runtime image
FROM alpine:latest

RUN apk add --no-cache ca-certificates libgcc

COPY --from=builder /build/target/release/helios /usr/local/bin/helios

EXPOSE 8545

ENTRYPOINT ["helios"]
