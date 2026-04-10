import { useEffect, useState } from "react";

const PREVIEW_WIDTH = 1280;
const PREVIEW_HEIGHT = 720;
const PREVIEW_FRAME_RATE = 30;

export function useWebcamPreview(enabled: boolean, deviceId?: string) {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!enabled) {
			setStream((current) => {
				current?.getTracks().forEach((track) => track.stop());
				return null;
			});
			setIsLoading(false);
			setError(null);
			return;
		}

		let cancelled = false;
		let activeStream: MediaStream | null = null;

		const startPreview = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const nextStream = await navigator.mediaDevices.getUserMedia({
					audio: false,
					video: deviceId
						? {
								deviceId: { exact: deviceId },
								width: { ideal: PREVIEW_WIDTH },
								height: { ideal: PREVIEW_HEIGHT },
								frameRate: { ideal: PREVIEW_FRAME_RATE, max: PREVIEW_FRAME_RATE },
							}
						: {
								width: { ideal: PREVIEW_WIDTH },
								height: { ideal: PREVIEW_HEIGHT },
								frameRate: { ideal: PREVIEW_FRAME_RATE, max: PREVIEW_FRAME_RATE },
							},
				});

				if (cancelled) {
					nextStream.getTracks().forEach((track) => track.stop());
					return;
				}

				activeStream = nextStream;
				setStream((current) => {
					current?.getTracks().forEach((track) => track.stop());
					return nextStream;
				});
			} catch (previewError) {
				if (!cancelled) {
					setError(
						previewError instanceof Error
							? previewError.message
							: "Unable to start webcam preview",
					);
					setStream((current) => {
						current?.getTracks().forEach((track) => track.stop());
						return null;
					});
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		void startPreview();

		return () => {
			cancelled = true;
			activeStream?.getTracks().forEach((track) => track.stop());
		};
	}, [enabled, deviceId]);

	return { stream, isLoading, error };
}
