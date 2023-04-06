#!/bin/bash

mkdir .vercel
mkdir .vercel/output

cp -r ./apps/navmesh-website/dist/* .vercel/output/
