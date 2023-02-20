import { privateEncrypt } from "crypto";
import { useState } from "react";
import { X } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import Web3 from "web3";
import {  Purchase } from "../helpers/api";
import { contract } from "../helpers/contract";
import { prettyDate } from "../helpers/utils";
import { useAddressState } from "../middleware/Wallet";
import routes from "../routes";
import ConfirmationModal from "./ConfirmationModal";
import SellButton from "./SellButton";

const PurchaseCard = (props: { purchase: Purchase, className?: string }) => {
	const [quantityToSell, setQuantityToSell] = useState(props.purchase.quantity);
	const [showConfirmationModal, setShowConfirmationModal] = useState(false);
	const [address] = useAddressState();
	const price = Number(Web3.utils.fromWei(props.purchase.event.price.toString(), "gwei"));

	const sellButtonOnClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
		e.preventDefault();
		e.stopPropagation();
		setShowConfirmationModal(true);
	};

	const sellTicket = async () => {
		try {
			// TODO: contract resale quantity
			await contract
				.methods
				.listTokenForResale(props.purchase.event.id)
				.send({ from: address })
			;
		} catch (e: any) {
			if (e.code !== 4001) {
				// TODO: error message
			}
		}
	};

	return (
		<>
			<Link to={routes.event(props.purchase.event.id)} className={"card flex w-full " + props.className}>
				<div className="my-auto grid grid-cols-12 w-full">
					<div className="col-span-12 lg:col-span-9 xl:col-span-10 flex">
						<img className="rounded shadow-lg m-5 hidden sm:block" src={props.purchase.event.imagePath} alt={props.purchase.event.artist} width={100} />
						<div className="my-5 mx-5 sm:mr-5 sm:ml-0 text-left w-full flex">
							<div className="my-auto w-full">
								<div className="italic mb-2">
									<h2 className="font-bold uppercase mr-2">
										{props.purchase.event.artist}
									</h2>
									<div className="text-xl">
										{props.purchase.event.name}
									</div>
								</div>
								<div className="text-xl font-bold text-indigo-500 flex items-center">
									{props.purchase.quantity} <X /> {price} ETH
								</div>
								<div className="text-md block">
									{props.purchase.event.venue} · {props.purchase.event.city} · {prettyDate(props.purchase.event.time)}
								</div>
							</div>
						</div>
					</div>
					<div className="col-span-12 lg:col-span-3 xl:col-span-2 mb-5 lg:mt-5 mx-5 mr-5 flex">
						<div className="lg:ml-auto">
							<SellButton
								event={props.purchase.event}
								quantity={props.purchase.quantity}
								defaultQuantity={quantityToSell}
								onClick={e => sellButtonOnClick(e)}
								onChange={e => setQuantityToSell(parseInt(e.target.value))}
							/>
						</div>
					</div>
				</div>
			</Link>
			{
				showConfirmationModal &&
				<ConfirmationModal
					title="Sell Ticket"
					message={`Are you sure you want to list ${quantityToSell} tickets for ${price} ETH each?`}
					close={() => setShowConfirmationModal(false)}
					action={() => sellTicket()}
				/>
			}
		</>
	);
};


export default PurchaseCard;
