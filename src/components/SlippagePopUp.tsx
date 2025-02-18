"use-client";

import React, { useState } from 'react';
import Popup from 'reactjs-popup';
import './pupup.css'; // Include this for default styles

const SlippagePopup: React.FC = () => {
    const [Slippage, setSlippage] = useState(2.00);

    return (
        <Popup
            trigger={
                <button
                    key={"slippage"}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-white text-xs rounded"
                >
                    Set Slippage
                </button>
            }
            modal
            nested
        >
            <div className="modal bg-gray-800 text-white p-2 rounded-lg shadow-lg max-w-sm mx-auto m-0">
                {/* Slippage Input */}
                <div className="mb-3 content-center">
                    <label className="block text-sm font-medium mb-3">Set Max. Slippage</label>
                    <input
                        type="number"
                        min="0.01"
                        max="5.00"
                        step="0.01"
                        value={Slippage}
                        onChange={(e) => {
                            if (parseFloat(e.target.value) > 25.00) {
                                setSlippage(25.00);
                            }
                            else {
                                setSlippage(parseFloat(e.target.value))
                            }
                        }
                        }
                        className="w-full p-2 bg-gray-700 rounded text-white focus:outline-none"
                    />
                </div>
                <div className="mb-3">
                    <span className="text-xs text-gray-400">This is the maximum amount of slippage you are willing to accept when placing trades. </span>
                    <span className="text-xs text-gray-400">Custom between 0% to 25% , Default is 2%</span>
                </div>
            </div>
        </Popup>
    );
};

export default SlippagePopup;
