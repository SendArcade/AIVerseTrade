export const GET = async (req, { params }) => {
    try {
        const { address } = await params;

        const response = await fetch(`https:///api/tokens/candlesticks/${address}/?timeframe=15&limit=1000`, {
            "headers": {
                "accept": "application/json",
            },
            "body": null,
            "method": "GET"
        });
        const data = await response.json();
        const candleStickData = data.candlesticks;

        return new Response(
            JSON.stringify({ candleStickData }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error(error);
        return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
};
