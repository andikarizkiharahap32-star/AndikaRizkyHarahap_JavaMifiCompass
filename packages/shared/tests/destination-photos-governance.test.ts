import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Meaningful Destination Photography & Next/Image Governance', () => {
  const homeDocPath = path.resolve(
    __dirname,
    '../../../design-system/pages/home.md'
  );
  const homePagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/page.tsx'
  );
  const destinationsPagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/destinations/page.tsx'
  );
  const nextConfigPath = path.resolve(
    __dirname,
    '../../../apps/web/next.config.mjs'
  );

  it('documents meaningful photography policy and ban on abstract art in home.md', () => {
    expect(fs.existsSync(homeDocPath)).toBe(true);
    const content = fs.readFileSync(homeDocPath, 'utf8');

    expect(content).toContain('Meaningful Destination Photography Policy');
    expect(content).toContain('Real Destination Photos Only Where Meaningful');
    expect(content).toContain('Zero Abstract Art');
    expect(content).toContain('Mandatory `next/image` Optimization');
    expect(content).toContain('images.unsplash.com');
  });

  it('verifies next.config.mjs explicitly allows images.unsplash.com', () => {
    const configCode = fs.readFileSync(nextConfigPath, 'utf8');
    expect(configCode).toContain('images.unsplash.com');
  });

  it('loads real destination landmark photos on Home presets via next/image', () => {
    const pageCode = fs.readFileSync(homePagePath, 'utf8');

    // Uses next/image component
    expect(pageCode).toContain("import Image from 'next/image'");
    expect(pageCode).toContain('<Image');
    expect(pageCode).toContain('aspect-video');
    expect(pageCode).toContain('sizes=');

    // Uses vetted Unsplash landmark photos
    expect(pageCode).toContain('https://images.unsplash.com/');

    // Zero abstract art allowed
    expect(pageCode).not.toContain('Chroma I');
    expect(pageCode).not.toContain('Nebula VI');
    expect(pageCode).not.toContain('Prism III');
    expect(pageCode).not.toContain('Aether IX');

    // No raw unoptimized <img> tags
    expect(pageCode).not.toContain('<img');
  });

  it('loads real destination landmark photos on /destinations via next/image', () => {
    const destCode = fs.readFileSync(destinationsPagePath, 'utf8');

    expect(destCode).toContain("import Image from 'next/image'");
    expect(destCode).toContain('<Image');
    expect(destCode).toContain('https://images.unsplash.com/');
    expect(destCode).not.toContain('<img');
  });
});
