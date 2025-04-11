
'use client';

import {useForm} from 'react-hook-form';
import {z} from 'zod';
import {zodResolver} from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {Textarea} from '@/components/ui/textarea';
import {Button} from '@/components/ui/button';
import {useRouter} from 'next/navigation';

const formSchema = z.object({
  budget: z.string().min(2, {
    message: 'Budget must be at least 2 characters.',
  }),
  tastes: z.string().min(10, {
    message: 'Tastes must be at least 10 characters.',
  }),
  goals: z.string().min(10, {
    message: 'Goals must be at least 10 characters.',
  }),
  needs: z.string().min(10, {
    message: 'Needs must be at least 10 characters.',
  }),
});

export default function IntakeQuestionnaire() {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budget: '',
      tastes: '',
      goals: '',
      needs: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);

    const searchParams = new URLSearchParams(values);
    router.push(`/moodboards?${searchParams.toString()}`);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6"
      >
        <FormField
          control={form.control}
          name="budget"
          render={({field}) => (
            <FormItem>
              <FormLabel>Budget</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter your budget" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="tastes"
          render={({field}) => (
            <FormItem>
              <FormLabel>Tastes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your tastes and preferences"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="goals"
          render={({field}) => (
            <FormItem>
              <FormLabel>Goals</FormLabel>
              <FormControl>
                <Textarea placeholder="What are your goals for this design?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="needs"
          render={({field}) => (
            <FormItem>
              <FormLabel>Needs</FormLabel>
              <FormControl>
                <Textarea placeholder="What are your needs for this design?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
