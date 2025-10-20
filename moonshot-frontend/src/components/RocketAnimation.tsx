"use client";

import { useEffect, useState } from "react";

export default function RocketAnimation() {
    const [frameIdx, setFrameIdx] = useState(0);
    const [counter, setCounter] = useState(80);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrameIdx((prev) => (prev + 1) % 6);
            setCounter((prev) => (prev - 0.1));
        }, counter);

        return () => clearInterval(interval);
    }, [counter]);

    return (
        <img src={`images/rocket/${frameIdx + 1}.png`} alt="Rocket" width={200} />
    )
}