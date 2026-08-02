import { Link } from '@inertiajs/react'
import { Package, Tags, ArrowRight } from 'lucide-react'
import { PageHeader } from '~/components/common/page_header'
import { buttonVariants } from '~/components/ui/button'
import { ManagementLayout } from '~/layouts/management_layout'

export default function ProductsAndServicesPage() {
  return (
    <ManagementLayout title="Produits et Services">
      <section className="flex w-full flex-col gap-6">
        <PageHeader
          title="Produits et Services"
          description="Gérez le catalogue des articles, les services, et les différentes catégories proposées par l'imprimerie."
          icon={Package}
        >
          <Link
            href="/management/product-categories"
            className={buttonVariants({ variant: 'outline' })}
          >
            <Tags className="mr-2 size-4" />
            Catégories des produits
            <ArrowRight className="ml-2 size-4" />
          </Link>
        </PageHeader>
      </section>
    </ManagementLayout>
  )
}
