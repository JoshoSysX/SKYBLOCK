import {describe,expect,it} from 'vitest';import {products} from './demo'
describe('catálogo',()=>{it('no contiene stock o precios inválidos',()=>{expect(products.every(p=>p.price>=0&&p.sizes.length>0)).toBe(true)});it('usa slugs únicos',()=>{expect(new Set(products.map(p=>p.slug)).size).toBe(products.length)})})
