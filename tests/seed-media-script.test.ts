import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';
import { describe, expect, it } from 'vitest';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const scriptPath = resolve(projectRoot, 'scripts/make-seed-media.sh');
const fixturePath = resolve(projectRoot, '.maestro/fixtures/seed-h264.mp4');

describe('CI 用シードメディア生成スクリプト', () => {
  it('コミット対象 fixture が H.264/AAC の MP4 である', () => {
    if (ffmpegPath === null) {
      throw new Error('ffmpeg-static の実行ファイルが解決できません。');
    }

    const probe = spawnSync(ffmpegPath, ['-hide_banner', '-i', fixturePath], {
      cwd: projectRoot,
      encoding: 'utf8',
    });

    expect(probe.stderr).toContain('Video: h264');
    expect(probe.stderr).toContain('Audio: aac');
  });

  it('ffmpeg-static を解決する生成手段を持つ', () => {
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain('npx --yes --package=ffmpeg-static -- node -e');
    expect(script).toContain('require("ffmpeg-static")');
    expect(script).toContain('.maestro/fixtures/seed-h264.mp4');
  });
});
