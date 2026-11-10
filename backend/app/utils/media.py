import os
import subprocess
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

def get_media_duration(file_path: str) -> float:
    """Get media duration in seconds using ffprobe."""
    if not os.path.exists(file_path):
        return 0.0
    cmd = [
        "ffprobe",
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        file_path
    ]
    try:
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        dur = float(result.stdout.strip())
        return dur
    except Exception as e:
        logger.warning(f"Failed to get media duration via ffprobe for {file_path}: {e}")
        return 0.0

def extract_audio_from_video(input_path: str, output_audio_path: Optional[str] = None) -> str:
    """
    Extract or convert any audio/video file into a normalized 16kHz mono 16-bit PCM WAV.
    Gnani Prisma works best with 16kHz mono WAV.
    """
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input file not found: {input_path}")

    if not output_audio_path:
        base, _ = os.path.splitext(input_path)
        output_audio_path = f"{base}_normalized_16k.wav"

    if os.path.exists(output_audio_path) and os.path.getsize(output_audio_path) > 1000:
        return output_audio_path

    cmd = [
        "ffmpeg",
        "-y",
        "-i", input_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_audio_path
    ]

    try:
        logger.info(f"Normalizing audio via FFmpeg: {' '.join(cmd)}")
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        if not os.path.exists(output_audio_path) or os.path.getsize(output_audio_path) == 0:
            raise RuntimeError("FFmpeg completed but output audio file is empty.")
        return output_audio_path
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg audio extraction error: {e.stderr}")
        raise RuntimeError(f"FFmpeg failed to extract audio: {e.stderr[:300]}")
    except FileNotFoundError:
        logger.error("FFmpeg binary is not found in system PATH.")
        raise RuntimeError("FFmpeg is required for audio extraction but was not found in system PATH.")

def slice_audio(audio_path: str, chunk_duration_sec: float = 28.0) -> List[Dict[str, Any]]:
    """
    Splits long audio into consecutive chunks of <= chunk_duration_sec (default 28s).
    Gnani Prisma REST API has a strict 30-second duration limit per call.
    Returns list of dicts:
    [{'chunk_path': str, 'start_sec': float, 'duration_sec': float}]
    """
    total_duration = get_media_duration(audio_path)
    if total_duration <= 0.0:
        # Fallback duration calculation if ffprobe couldn't determine duration
        total_duration = 30.0

    if total_duration <= chunk_duration_sec:
        return [{
            "chunk_path": audio_path,
            "start_sec": 0.0,
            "duration_sec": total_duration,
            "is_temp": False
        }]

    chunks: List[Dict[str, Any]] = []
    base, _ = os.path.splitext(audio_path)
    current_start = 0.0
    chunk_idx = 0

    while current_start < total_duration:
        chunk_dur = min(chunk_duration_sec, total_duration - current_start)
        if chunk_dur < 0.5:
            break

        chunk_path = f"{base}_chunk_{chunk_idx:04d}.wav"
        cmd = [
            "ffmpeg",
            "-y",
            "-ss", f"{current_start:.3f}",
            "-t", f"{chunk_dur:.3f}",
            "-i", audio_path,
            "-acodec", "copy",
            chunk_path
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            chunks.append({
                "chunk_path": chunk_path,
                "start_sec": current_start,
                "duration_sec": chunk_dur,
                "is_temp": True
            })
        except subprocess.CalledProcessError as e:
            logger.error(f"Failed to slice audio chunk at {current_start}s: {e.stderr}")
            # Try re-encoding if copy fails
            cmd_reencode = [
                "ffmpeg", "-y",
                "-ss", f"{current_start:.3f}",
                "-t", f"{chunk_dur:.3f}",
                "-i", audio_path,
                "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
                chunk_path
            ]
            subprocess.run(cmd_reencode, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
            chunks.append({
                "chunk_path": chunk_path,
                "start_sec": current_start,
                "duration_sec": chunk_dur,
                "is_temp": True
            })

        current_start += chunk_dur
        chunk_idx += 1

    logger.info(f"Sliced {total_duration:.1f}s audio into {len(chunks)} chunks for Gnani Prisma.")
    return chunks

def cleanup_temp_chunks(chunks: List[Dict[str, Any]]):
    """Safely delete temporary audio chunk files."""
    for c in chunks:
        if c.get("is_temp") and os.path.exists(c["chunk_path"]):
            try:
                os.remove(c["chunk_path"])
            except Exception as e:
                logger.warning(f"Could not remove temp chunk {c['chunk_path']}: {e}")
